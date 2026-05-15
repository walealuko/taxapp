import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Language, t as translate } from '../constants/i18n';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: async () => {},
  t: (key) => translate(key, 'en'),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const l = await SecureStore.getItemAsync('app_lang');
        if (l && ['en', 'yo', 'ha', 'ig'].includes(l)) {
          setLangState(l as Language);
        }
      } catch {
        // SecureStore not available on web - ignore
      }
    };
    loadLang();
  }, []);

  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    try {
      await SecureStore.setItemAsync('app_lang', newLang);
    } catch {
      // SecureStore not available on web - ignore
    }
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: (key, params) => translate(key, lang, params) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
