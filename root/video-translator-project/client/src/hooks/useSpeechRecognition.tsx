import { useState, useRef, useCallback } from "react";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: (language?: string) => Promise<string | null>;
  stopListening: () => void;
}

// Track whether we're currently trying to start (prevents double-init)
let isStartingRef = false;

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async (language: string = 'en-US'): Promise<string | null> => {
    // Guard: prevent double-start
    if (isStartingRef) {
      console.log("⏳ Speech recognition already starting, skipping duplicate call");
      return null;
    }

    console.log("🎤 STARTING SPEECH RECOGNITION - language:", language);

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("❌ Speech recognition not supported in this browser");
      alert("Your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge.");
      return null;
    }

    console.log("✅ Browser supports speech recognition");

    // Stop any existing instance first
    if (recognitionRef.current) {
      console.log("🛑 Stopping existing recognition instance before starting new one");
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      console.log("🔧 Creating speech recognition instance...");
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;   // Keep listening continuously
      recognition.interimResults = true; // Get interim results
      recognition.maxAlternatives = 1;

      // Don't restart on no-speech — this is normal silence, not an error
      // Restart ONLY on fatal errors (not 'aborted' or 'no-speech')
      recognition.onstart = () => {
        isStartingRef = false;
        setIsListening(true);
        console.log('🎤 Speech recognition STARTED successfully! Say something...');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results as any;
        const lastResultIndex = results.length - 1;
        const speechResult = results[lastResultIndex][0];
        const recognizedText = speechResult.transcript;
        const confidence = speechResult.confidence || 0.9;

        if (results[lastResultIndex].isFinal) {
          setTranscript(recognizedText);
          console.log('🎯 FINAL speech recognized:', recognizedText, 'Confidence:', confidence);

          if (recognizedText.trim()) {
            console.log('📤 Sending for translation:', recognizedText);
            window.dispatchEvent(new CustomEvent('speechRecognized', {
              detail: { text: recognizedText, confidence, isFinal: true }
            }));
          }
        } else {
          console.log('📝 Interim speech:', recognizedText);
          if (recognizedText.trim()) {
            window.dispatchEvent(new CustomEvent('speechRecognized', {
              detail: { text: recognizedText, confidence, isFinal: false }
            }));
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);

        // 'no-speech' and 'aborted' are non-fatal — don't treat them as errors
        const fatalErrors = ['not-allowed', 'service-not-allowed', 'network'];
        if (fatalErrors.includes(event.error)) {
          console.error('❌ Fatal speech recognition error — stopping:', event.error);
          setIsListening(false);
          // Reject so the caller knows it truly failed
          if (recognitionRef.current) {
            recognitionRef.current = null;
          }
        } else {
          // 'no-speech', 'aborted', 'audio-capture' — these are normal
          // Just log and let the recognition instance handle itself
          console.log('ℹ️ Non-fatal speech error (normal):', event.error);
          // Keep listening state as-is — don't reject
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended naturally');
        // Clear the ref so stopListening doesn't try to stop a dead instance
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };

      // Set ref BEFORE start() — critical fix!
      // This ensures stopListening() always has a valid reference
      recognitionRef.current = recognition;
      isStartingRef = true;

      console.log("🚀 CALLING recognition.start()...");
      recognition.start();
      console.log("⏳ Waiting for speech recognition to start...");

      // Resolve immediately — the onstart handler will update state
      return null;

    } catch (error: any) {
      isStartingRef = false;
      console.error("❌ Error starting speech recognition:", error?.message || error);

      // 'InvalidStateError' means recognition is already running — stop and retry
      if (error?.name === 'InvalidStateError') {
        console.log("🔄 Recognition already running — stopping and clearing");
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
          recognitionRef.current = null;
        }
      }

      setIsListening(false);
      return null;
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log("🛑 STOPPING speech recognition");
    isStartingRef = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("✅ recognition.stop() called successfully");
      } catch (error) {
        console.warn("⚠️ Error calling stop():", error);
      }
      // Don't null out the ref here — onend will fire after stop()
      // and clean it up. Nulling it here would race with onend.
    } else {
      console.warn("⚠️ recognitionRef.current was null — nothing to stop");
    }

    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
