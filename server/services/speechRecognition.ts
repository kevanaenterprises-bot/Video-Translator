// Simple server-side speech recognition service
// The actual speech recognition now happens in the browser using Web Speech API
export class SpeechRecognitionService {
  constructor() {
    console.log('Using Web Speech API - browser-based recognition, no API key required!');
  }

  // This method now just validates and passes through the transcript from the client
  async recognizeSpeech(
    transcript: string, // Already recognized text from browser
    languageCode: string = 'en-US',
    confidence: number = 0.9
  ): Promise<{ transcript: string; confidence: number }> {
    // Simple validation and pass-through since recognition happens in browser
    if (!transcript || transcript.trim().length === 0) {
      return { transcript: '', confidence: 0 };
    }

    return {
      transcript: transcript.trim(),
      confidence: confidence,
    };
  }

  async recognizeEnglishSpeech(transcript: string, confidence: number = 0.9): Promise<{ transcript: string; confidence: number }> {
    return this.recognizeSpeech(transcript, 'en-US', confidence);
  }

  async recognizeVietnameseSpeech(transcript: string, confidence: number = 0.9): Promise<{ transcript: string; confidence: number }> {
    return this.recognizeSpeech(transcript, 'vi-VN', confidence);
  }

  isConfigured(): boolean {
    return true; // Web Speech API is always available in browsers
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
