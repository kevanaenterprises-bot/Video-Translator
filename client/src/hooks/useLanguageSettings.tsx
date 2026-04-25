import { useState, useEffect, useRef } from "react";

export interface Language {
  code: string;
  name: string;
  flag: string;
  speechCode?: string; // For speech recognition
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", speechCode: "en-US" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", speechCode: "vi-VN" },
  { code: "es", name: "Spanish", flag: "🇪🇸", speechCode: "es-ES" },
  { code: "fr", name: "French", flag: "🇫🇷", speechCode: "fr-FR" },
  { code: "de", name: "German", flag: "🇩🇪", speechCode: "de-DE" },
  { code: "it", name: "Italian", flag: "🇮🇹", speechCode: "it-IT" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", speechCode: "pt-BR" },
  { code: "ru", name: "Russian", flag: "🇷🇺", speechCode: "ru-RU" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", speechCode: "ja-JP" },
  { code: "ko", name: "Korean", flag: "🇰🇷", speechCode: "ko-KR" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", speechCode: "zh-CN" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", speechCode: "ar-SA" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", speechCode: "hi-IN" },
  { code: "th", name: "Thai", flag: "🇹🇭", speechCode: "th-TH" },
];

interface LanguageSettings {
  yourLanguage: string;
  partnerLanguage: string;
}

function loadSettings(): LanguageSettings {
  try {
    const saved = localStorage.getItem('speakeasy-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.yourLanguage && parsed.partnerLanguage) return parsed;
    }
  } catch {}
  return { yourLanguage: 'en', partnerLanguage: 'en' };
}

export const useLanguageSettings = () => {
  // Lazy initializer reads from storage synchronously so the first render
  // already has the correct values — prevents the save effect from
  // overwriting contact-selected languages with defaults.
  const [settings, setSettings] = useState<LanguageSettings>(loadSettings);
  const isFirstRender = useRef(true);

  // Persist whenever settings change, but skip the very first render so we
  // don't clobber what home.tsx wrote just before navigating here.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    localStorage.setItem('speakeasy-settings', JSON.stringify(settings));
  }, [settings]);

  const getLanguage = (code: string): Language => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
  };

  const updateLanguages = (yourLang: string, partnerLang: string) => {
    setSettings({ yourLanguage: yourLang, partnerLanguage: partnerLang });
  };

  const swapLanguages = () => {
    setSettings(prev => ({
      yourLanguage: prev.partnerLanguage,
      partnerLanguage: prev.yourLanguage,
    }));
  };

  return {
    settings,
    yourLanguage: getLanguage(settings.yourLanguage),
    partnerLanguage: getLanguage(settings.partnerLanguage),
    updateLanguages,
    swapLanguages,
    getSpeechCode: (code: string) => getLanguage(code).speechCode || code,
  };
};