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
  const languageRef = useRef(languageCode);
  const targetRef = useRef(targetLanguage);

  useEffect(() => { languageRef.current = languageCode; }, [languageCode]);
  useEffect(() => { targetRef.current = targetLanguage; }, [targetLanguage]);

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
      }));
    } catch (err) {
      console.error('Failed to send audio chunk:', err);
    }
  }, [sessionId, wsRef]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg;codecs=opus';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);

          // Reset silence timer — send after silence
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            sendChunk();
          }, SILENCE_TIMEOUT_MS);
        }
      };

      // Request data every 250ms so we get frequent chunks
      recorder.start(250);
      console.log(`🎙️ Google STT recording started (${languageCode})`);
    } catch (err) {
      console.error('Failed to start Google STT recording:', err);
    }
  }, [languageCode, sendChunk]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    // Send any remaining audio
    sendChunk();

    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    console.log('🛑 Google STT recording stopped');
  }, [sendChunk]);

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
