import { useRef, useCallback, useEffect } from "react";

interface UseGoogleSTTOptions {
  languageCode: string;       // e.g. "en-US", "vi-VN"
  targetLanguage: string;     // e.g. "vi", "en"
  sessionId: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  localStream?: MediaStream | null;  // reuse WebRTC stream instead of opening a second mic
  onInterim: (text: string) => void;
  onResult: (transcript: string, confidence: number) => void;
  isActive: boolean;
}

// Minimum recorded duration worth sending (ms)
const MIN_CHUNK_MS = 500;
// Max duration to accumulate before force-sending (ms) — must stay under Google STT 1-min limit
const CHUNK_INTERVAL_MS = 4000;
// RMS silence threshold — frames below this are considered silence and skipped
const SILENCE_RMS_THRESHOLD = 0.003;

export function useGoogleSTT({
  languageCode,
  targetLanguage,
  sessionId,
  wsRef,
  localStream,
  onInterim,
  onResult,
  isActive,
}: UseGoogleSTTOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkMimeRef = useRef<string>('');

  // Ref so startRecording always reads the latest localStream (avoids stale closure)
  const localStreamRef = useRef(localStream);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // Refs so sendChunk always uses the latest language/target regardless of closure age
  const languageRef = useRef(languageCode);
  const targetRef = useRef(targetLanguage);
  useEffect(() => { languageRef.current = languageCode; }, [languageCode]);
  useEffect(() => { targetRef.current = targetLanguage; }, [targetLanguage]);

  // ── Send accumulated chunks ───────────────────────────────────────────────
  const sendChunk = useCallback(async () => {
    if (chunksRef.current.length === 0) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const blob = new Blob(chunksRef.current, { type: chunkMimeRef.current });
    chunksRef.current = [];

    // Path A — WebM/OGG: send raw bytes, server decodes as WEBM_OPUS or OGG_OPUS
    if (chunkMimeRef.current.includes('webm') || chunkMimeRef.current.includes('ogg')) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const encoding = chunkMimeRef.current.includes('ogg') ? 'OGG_OPUS' : 'WEBM_OPUS';
        ws.send(JSON.stringify({
          type: 'audio-chunk',
          audioBase64: base64,
          languageCode: languageRef.current,
          targetLanguage: targetRef.current,
          sessionId,
          speakerId: 'local',
          encoding,
          sampleRate: 48000,
        }));
        console.log(`📤 Sent WebM/OGG chunk (${blob.size} bytes)`);
      } catch (err) {
        console.error('Failed to send WebM chunk:', err);
      }
      return;
    }

    // Path B — MP4/other (Safari): decode client-side to LINEAR16, then send
    // Safari includes full MP4 headers in every timesliced chunk so decodeAudioData works
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const decodeCtx = new AudioContext();
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      } catch (decodeErr) {
        console.warn('decodeAudioData failed for chunk — skipping:', decodeErr);
        decodeCtx.close();
        return;
      }
      decodeCtx.close();

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const durationMs = (channelData.length / sampleRate) * 1000;

      if (durationMs < MIN_CHUNK_MS) return;

      // RMS check — skip silent chunks
      let sumSq = 0;
      for (let i = 0; i < channelData.length; i++) sumSq += channelData[i] * channelData[i];
      const rms = Math.sqrt(sumSq / channelData.length);
      if (rms < SILENCE_RMS_THRESHOLD) {
        console.log(`🔇 Silent chunk skipped (RMS ${rms.toFixed(4)})`);
        return;
      }

      // Convert float32 → int16 PCM
      const int16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
      }

      // Encode as base64
      const uint8 = new Uint8Array(int16.buffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);

      ws.send(JSON.stringify({
        type: 'audio-chunk',
        audioBase64: base64,
        languageCode: languageRef.current,
        targetLanguage: targetRef.current,
        sessionId,
        speakerId: 'local',
        encoding: 'LINEAR16',
        sampleRate,
      }));
      console.log(`📤 Sent Safari MP4→LINEAR16 chunk (${(durationMs / 1000).toFixed(1)}s, RMS ${rms.toFixed(3)})`);
    } catch (err) {
      console.error('Failed to send Safari audio chunk:', err);
    }
  }, [sessionId, wsRef]);

  // Active flag so the restart loop knows when to stop
  const activeRef = useRef(false);
  // Captured audio stream (null = reusing WebRTC stream we don't own)
  const capturedStreamRef = useRef<MediaStream | null>(null);

  // ── One recording cycle: record for CHUNK_INTERVAL_MS, send, repeat ───────
  const runCycle = useCallback(async (mimeType: string, stream: MediaStream) => {
    if (!activeRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      await sendChunk();
      // Chain next cycle only if still active
      if (activeRef.current) {
        runCycle(mimeType, stream);
      }
    };

    // Record for exactly CHUNK_INTERVAL_MS then stop — onstop triggers send + next cycle
    recorder.start();
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, CHUNK_INTERVAL_MS);
  }, [sendChunk]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      activeRef.current = true;

      // Prefer existing WebRTC stream — avoids double getUserMedia on iOS/Safari
      const liveStream = localStreamRef.current;
      let stream: MediaStream;
      if (liveStream && liveStream.getAudioTracks().length > 0) {
        stream = new MediaStream(liveStream.getAudioTracks());
        capturedStreamRef.current = null; // we don't own this — don't stop it
        console.log('🎙️ Reusing WebRTC audio track for STT');
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        capturedStreamRef.current = stream;
        console.log('🎙️ Opened dedicated mic stream for STT');
      }

      // Determine best supported recording format
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : null;

      if (!mimeType) {
        console.error('❌ No supported MediaRecorder MIME type — STT unavailable');
        activeRef.current = false;
        return;
      }

      chunkMimeRef.current = mimeType;
      console.log(`🎙️ Google STT starting (${mimeType}, ${CHUNK_INTERVAL_MS}ms cycles)`);

      // Kick off the first cycle — each cycle chains into the next via onstop
      runCycle(mimeType, stream);
    } catch (err) {
      console.error('Failed to start Google STT recording:', err);
      activeRef.current = false;
    }
  }, [runCycle]);

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    // Signal the cycle chain to stop after the current recording finishes
    activeRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Only stop tracks we opened ourselves (not the shared WebRTC stream)
    if (capturedStreamRef.current) {
      capturedStreamRef.current.getTracks().forEach(t => t.stop());
      capturedStreamRef.current = null;
    }

    chunksRef.current = [];
    console.log('🛑 Google STT recording stopped');
  }, []);

  useEffect(() => {
    if (isActive) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
  }, [isActive]);

  return { startRecording, stopRecording };
}
