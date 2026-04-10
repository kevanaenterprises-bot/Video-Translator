import { useRef, useCallback, useEffect } from "react";

interface UseGoogleSTTOptions {
  languageCode: string;       // e.g. "en-US", "vi-VN"
  targetLanguage: string;     // e.g. "vi", "en"
  sessionId: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onInterim: (text: string) => void;
  onResult: (transcript: string, confidence: number) => void;
  isActive: boolean;
}

// Minimum audio duration to bother sending (ms) — avoids sending silence
const MIN_CHUNK_MS = 300;
// Max silence before we cut and send the chunk (ms)
const SILENCE_TIMEOUT_MS = 1200;

export function useGoogleSTT({
  languageCode,
  targetLanguage,
  sessionId,
  wsRef,
  onInterim,
  onResult,
  isActive,
}: UseGoogleSTTOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  // Refs so sendChunk always reads the latest language/target
  const languageRef = useRef(languageCode);
  const targetRef = useRef(targetLanguage);
  useEffect(() => { languageRef.current = languageCode; }, [languageCode]);
  useEffect(() => { targetRef.current = targetLanguage; }, [targetLanguage]);

  // iOS fallback: AudioContext PCM recording
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmBufferRef = useRef<Int16Array[]>([]);
  const encodingRef = useRef<string>('WEBM_OPUS');
  const sampleRateRef = useRef<number>(48000);
  const usingAudioContextRef = useRef(false);

  // ── Send a WebM/Ogg chunk (Chrome/Firefox/Android) ───────────────────────
  const sendChunk = useCallback(async () => {
    if (chunksRef.current.length === 0) return;
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < MIN_CHUNK_MS) return;

    const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      ws.send(JSON.stringify({
        type: 'audio-chunk',
        audioBase64: base64,
        languageCode: languageRef.current,
        targetLanguage: targetRef.current,
        sessionId,
        speakerId: 'local',
        encoding: encodingRef.current,
        sampleRate: sampleRateRef.current,
      }));
    } catch (err) {
      console.error('Failed to send audio chunk:', err);
    }
  }, [sessionId, wsRef]);

  // ── Send a LINEAR16 PCM chunk (iOS Safari fallback) ───────────────────────
  const sendPCMChunk = useCallback(() => {
    if (pcmBufferRef.current.length === 0) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Concatenate all buffered PCM frames
    const totalLen = pcmBufferRef.current.reduce((s, b) => s + b.length, 0);
    const combined = new Int16Array(totalLen);
    let offset = 0;
    for (const buf of pcmBufferRef.current) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    pcmBufferRef.current = [];

    const elapsedMs = (totalLen / sampleRateRef.current) * 1000;
    if (elapsedMs < MIN_CHUNK_MS) return;

    // Convert Int16Array → base64
    const uint8 = new Uint8Array(combined.buffer);
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
      sampleRate: sampleRateRef.current,
    }));
  }, [sessionId, wsRef]);

  // ── AudioContext recording (iOS fallback) ────────────────────────────────
  const startAudioContextRecording = useCallback((stream: MediaStream) => {
    const SAMPLE_RATE = 16000;
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioContextRef.current = ctx;
    sampleRateRef.current = SAMPLE_RATE;
    usingAudioContextRef.current = true;
    pcmBufferRef.current = [];

    const source = ctx.createMediaStreamSource(stream);
    // ScriptProcessor is deprecated but works on all browsers including iOS
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      // Convert float32 [-1, 1] → int16 [-32768, 32767]
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      }
      pcmBufferRef.current.push(int16);

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        sendPCMChunk();
      }, SILENCE_TIMEOUT_MS);
    };

    source.connect(processor);
    // Connect to destination is needed to keep the ScriptProcessor running
    processor.connect(ctx.destination);
    console.log(`🎙️ Google STT recording started via AudioContext (iOS, ${SAMPLE_RATE}Hz)`);
  }, [sendPCMChunk]);

  // ── Main recording start ─────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Determine best supported MIME type
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus'
        : null;

      if (mimeType) {
        // Chrome / Firefox / Android
        encodingRef.current = mimeType.includes('ogg') ? 'OGG_OPUS' : 'WEBM_OPUS';
        sampleRateRef.current = 48000;
        usingAudioContextRef.current = false;

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        startTimeRef.current = Date.now();

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              sendChunk();
            }, SILENCE_TIMEOUT_MS);
          }
        };

        recorder.start(250);
        console.log(`🎙️ Google STT recording started via MediaRecorder (${mimeType})`);
      } else {
        // iOS Safari fallback — use AudioContext → LINEAR16
        startAudioContextRecording(stream);
      }
    } catch (err) {
      console.error('Failed to start Google STT recording:', err);
    }
  }, [languageCode, sendChunk, startAudioContextRecording]);

  // ── Recording stop ───────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (usingAudioContextRef.current) {
      // Flush remaining PCM
      sendPCMChunk();
      processorRef.current?.disconnect();
      processorRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
    } else {
      // Flush remaining WebM chunks
      sendChunk();
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    usingAudioContextRef.current = false;
    console.log('🛑 Google STT recording stopped');
  }, [sendChunk, sendPCMChunk]);

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
