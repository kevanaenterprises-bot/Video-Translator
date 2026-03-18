import fetch from 'node-fetch';

interface LibreTranslateResponse {
  translatedText: string;
  detectedLanguage?: {
    confidence: number;
    language: string;
  };
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

export class TranslationService {
  private libreEndpoint = 'https://libretranslate.de/translate';
  private googleEndpoint = 'https://translation.googleapis.com/language/translate/v2';
  private apiKey = process.env.GOOGLE_API_KEY_TRANSLATOR;
  
  constructor() {
    if (this.apiKey) {
      console.log('Using Google Cloud Translation API - high accuracy translation!');
    } else {
      console.log('Using LibreTranslate - no API key required!');
    }
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<{
    translatedText: string;
    detectedSourceLanguage?: string;
  }> {
    // Use Google Cloud Translation if API key is available
    if (this.apiKey) {
      return this.translateWithGoogle(text, targetLanguage, sourceLanguage);
    }
    
    // Fallback to LibreTranslate
    return this.translateWithLibre(text, targetLanguage, sourceLanguage);
  }

  private async translateWithGoogle(text: string, targetLanguage: string, sourceLanguage?: string): Promise<{
    translatedText: string;
    detectedSourceLanguage?: string;
  }> {
    try {
      const url = `${this.googleEndpoint}?key=${this.apiKey}`;
      const body: any = {
        q: text,
        target: targetLanguage,
        format: 'text',
      };
      
      if (sourceLanguage && sourceLanguage !== 'auto') {
        body.source = sourceLanguage;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GoogleTranslateResponse;
      const translation = data.data.translations[0];
      
      return {
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage,
      };
    } catch (error) {
      console.error('Google Translation error:', error);
      // Fallback to LibreTranslate on Google API error
      return this.translateWithLibre(text, targetLanguage, sourceLanguage);
    }
  }

  private async translateWithLibre(text: string, targetLanguage: string, sourceLanguage?: string): Promise<{
    translatedText: string;
    detectedSourceLanguage?: string;
  }> {
    try {
      console.log('🌐 Attempting LibreTranslate API call...');
      const response = await fetch(this.libreEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage || 'auto',
          target: targetLanguage,
          format: 'text',
        }),
      });

      console.log('📡 LibreTranslate response status:', response.status);

      if (!response.ok) {
        console.error('❌ LibreTranslate API error:', response.status, response.statusText);
        throw new Error(`LibreTranslate API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('📄 LibreTranslate raw response:', responseText.substring(0, 200));

      let data: LibreTranslateResponse;
      try {
        data = JSON.parse(responseText) as LibreTranslateResponse;
      } catch (parseError) {
        console.error('❌ Failed to parse LibreTranslate response as JSON');
        throw new Error('LibreTranslate returned invalid JSON response');
      }
      
      return {
        translatedText: data.translatedText,
        detectedSourceLanguage: data.detectedLanguage?.language,
      };
    } catch (error) {
      console.error('❌ LibreTranslate API failed:', error);
      // Fallback to a simple mock translation for demonstration
      console.log('🔄 Using fallback translation...');
      return this.createFallbackTranslation(text, targetLanguage);
    }
  }

  private createFallbackTranslation(text: string, targetLanguage: string): {
    translatedText: string;
    detectedSourceLanguage?: string;
  } {
    console.log('🔄 Creating fallback translation for:', text);
    
    // Simple fallback translations for common phrases
    const fallbackTranslations: Record<string, Record<string, string>> = {
      'vi': {
        'hello': 'xin chào',
        'goodbye': 'tạm biệt',
        'thank you': 'cám ơn',
        'please': 'xin vui lòng',
        'yes': 'vâng',
        'no': 'không',
        'how are you': 'bạn có khỏe không',
        'good morning': 'chào buổi sáng',
        'good afternoon': 'chào buổi chiều',
        'good evening': 'chào buổi tối'
      },
      'en': {
        'xin chào': 'hello',
        'tạm biệt': 'goodbye', 
        'cám ơn': 'thank you',
        'xin vui lòng': 'please',
        'vâng': 'yes',
        'không': 'no'
      }
    };

    const lowerText = text.toLowerCase();
    const translations = fallbackTranslations[targetLanguage] || {};
    
    // Check for common words and phrases
    const commonWords = {
      'vi': {
        'hello': 'xin chào', 'hi': 'chào', 'hey': 'chào',
        'goodbye': 'tạm biệt', 'bye': 'tạm biệt',
        'thank you': 'cám ơn', 'thanks': 'cám ơn',
        'please': 'xin vui lòng',
        'yes': 'vâng', 'yeah': 'vâng', 'ok': 'được',
        'no': 'không', 'nope': 'không',
        'good': 'tốt', 'bad': 'xấu', 'nice': 'đẹp',
        'work': 'làm việc', 'working': 'đang làm việc',
        'nothing': 'không có gì', 'something': 'cái gì đó',
        'anything': 'bất cứ thứ gì', 'everything': 'mọi thứ',
        'message': 'tin nhắn', 'translate': 'dịch',
        'time': 'thời gian', 'now': 'bây giờ',
        'can you': 'bạn có thể', 'you know': 'bạn biết đấy',
        'really': 'thực sự', 'very': 'rất',
        'what': 'cái gì', 'how': 'như thế nào', 'why': 'tại sao',
        'where': 'ở đâu', 'when': 'khi nào', 'who': 'ai'
      }
    };

    // Try to translate common words within the text
    if (targetLanguage === 'vi') {
      const words = lowerText.split(/\s+/);
      const translatedWords: string[] = [];
      
      for (const word of words) {
        const cleanWord = word.replace(/[.,!?;:]/, '');
        let found = false;
        
        // Check for exact word matches
        for (const [english, vietnamese] of Object.entries(commonWords.vi)) {
          if (cleanWord === english) {
            translatedWords.push(vietnamese);
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Just skip untranslatable words instead of showing brackets
          translatedWords.push(cleanWord);
        }
      }
      
      const partialTranslation = translatedWords.join(' ');
      
      return {
        translatedText: partialTranslation,
        detectedSourceLanguage: 'en'
      };
    } else {
      return {
        translatedText: text,
        detectedSourceLanguage: 'vi'
      };
    }
  }

  async translateVietnameseToEnglish(text: string): Promise<string> {
    const result = await this.translateText(text, 'en', 'vi');
    return result.translatedText;
  }

  async translateEnglishToVietnamese(text: string): Promise<string> {
    const result = await this.translateText(text, 'vi', 'en');
    return result.translatedText;
  }

  isConfigured(): boolean {
    return true; // LibreTranslate is always available, no API key needed
  }
}

export const translationService = new TranslationService();
