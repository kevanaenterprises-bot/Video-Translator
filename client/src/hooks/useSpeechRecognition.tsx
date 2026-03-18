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

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async (language: string = 'en-US'): Promise<string | null> => {
    console.log("🎤 STARTING SPEECH RECOGNITION - language:", language);
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("❌ Speech recognition not supported in this browser");
      alert("Your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge.");
      return null;
    }

    console.log("✅ Browser supports speech recognition");

    try {
      console.log("🔧 Creating speech recognition instance...");
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;  // Keep listening continuously
      recognition.interimResults = true;  // Get interim results
      recognition.maxAlternatives = 1;
      
      console.log("⚙️ Speech recognition configured:", {
        language: recognition.lang,
        continuous: recognition.continuous,
        interimResults: recognition.interimResults
      });

      return new Promise((resolve, reject) => {
        recognition.onstart = () => {
          setIsListening(true);
          console.log('🎤 Speech recognition STARTED successfully! Say something...');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Get the latest result
          const results = event.results as any;
          const lastResultIndex = results.length - 1;
          const speechResult = results[lastResultIndex][0];
          const recognizedText = speechResult.transcript;
          const confidence = speechResult.confidence || 0.9;
          
          // Process both interim and final results
          if (results[lastResultIndex].isFinal) {
            setTranscript(recognizedText);
            console.log('🎯 FINAL speech recognized:', recognizedText, 'Confidence:', confidence);
            
            // Send final result for translation immediately
            if (recognizedText.trim()) {
              console.log('📤 Sending for translation:', recognizedText);
              // Dispatch a custom event that the translation hook can listen to
              window.dispatchEvent(new CustomEvent('speechRecognized', { 
                detail: { text: recognizedText, confidence, isFinal: true } 
              }));
            }
          } else {
            console.log('📝 Interim speech:', recognizedText);
            // Also send interim results for live preview
            if (recognizedText.trim()) {
              window.dispatchEvent(new CustomEvent('speechRecognized', { 
                detail: { text: recognizedText, confidence, isFinal: false } 
              }));
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          reject(new Error(event.error));
        };

        recognition.onend = () => {
          setIsListening(false);
          console.log('Speech recognition ended');
        };

        recognitionRef.current = recognition;
        console.log("🚀 CALLING recognition.start()...");
        recognition.start();
        console.log("⏳ Waiting for speech recognition to start...");
      });

    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
      return null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
