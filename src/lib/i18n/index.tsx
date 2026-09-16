import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import type { Language, Localized } from '@/types';
import { uk, type TranslationKey } from './uk';
import { en } from './en';

const dictionaries: Record<Language, Record<TranslationKey, string>> = { uk, en };

export const LANGUAGES: { id: Language; label: string; flag: string; native: string }[] = [
  { id: 'uk', label: 'Українська', flag: '🇺🇦', native: 'UA' },
  { id: 'en', label: 'English', flag: '🇬🇧', native: 'EN' },
];

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Resolves a `Localized` record (tool names, category names…). */
  tl: (value: Localized) => string;
  /** Locale tag for Intl APIs. */
  locale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLanguage(): Language {
  const stored = readStorage<Language | null>(StorageKeys.language, null);
  if (stored === 'uk' || stored === 'en') return stored;
  return 'uk'; // Ukrainian is the product default.
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    writeStorage(StorageKeys.language, next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[language];
    return {
      language,
      setLanguage,
      locale: language === 'uk' ? 'uk-UA' : 'en-US',
      t: (key, vars) => {
        const template = dict[key] ?? uk[key] ?? String(key);
        if (!vars) return template;
        return template.replace(/\{(\w+)\}/g, (match, name: string) =>
          name in vars ? String(vars[name]) : match,
        );
      },
      tl: (localized) => localized?.[language] ?? localized?.uk ?? '',
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
}

export type { TranslationKey };
