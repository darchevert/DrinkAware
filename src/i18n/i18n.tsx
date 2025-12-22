import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, SupportedLanguage } from './translations';

type TranslationDict = typeof translations;

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const APP_LANG_KEY = 'app_language';

function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
    return locale.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('fr');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(APP_LANG_KEY);
      if (stored === 'fr' || stored === 'en') {
        setLanguageState(stored);
      } else {
        setLanguageState(detectDeviceLanguage());
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    await AsyncStorage.setItem(APP_LANG_KEY, lang);
    setLanguageState(lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Path<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

type TranslationKey = Path<TranslationDict['fr']>;

function getNested(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => String(params[key.trim()] ?? ''));
}

export function t(key: TranslationKey, params?: Record<string, string | number>) {
  const lang = detectDeviceLanguage();
  const value = getNested(translations[lang], key);
  if (typeof value === 'string') return interpolate(value, params);
  return key;
}

export function useT() {
  const { language } = useLanguage();
  return useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    const value = getNested(translations[language], key);
    if (typeof value === 'string') return interpolate(value, params);
    return key;
  }, [language]);
}


