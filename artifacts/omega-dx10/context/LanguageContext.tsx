import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translate } from '@/constants/i18n';

const STORAGE_KEY = '@omega_language';

interface LanguageContextValue {
  language: Language;
  isLanguageLoaded: boolean;
  isLanguageSelected: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  isLanguageLoaded: false,
  isLanguageSelected: false,
  setLanguage: async () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('pt');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'pt' || stored === 'en' || stored === 'es') {
          setLang(stored);
          setIsLanguageSelected(true);
        }
      } catch {}
      setIsLanguageLoaded(true);
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    setIsLanguageSelected(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  const t = useCallback((key: string) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, isLanguageLoaded, isLanguageSelected, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
