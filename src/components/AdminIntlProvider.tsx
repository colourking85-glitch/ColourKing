'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

import en from '@/messages/en.json';
import nl from '@/messages/nl.json';
import tr from '@/messages/tr.json';

type Locale = 'nl' | 'en' | 'tr';

const MESSAGES: Record<Locale, typeof en> = { en, nl, tr };
const STORAGE_KEY = 'ck-locale';

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: 'nl', setLocale: () => {} });

export function useAppLocale() {
  return useContext(LocaleContext);
}

export function AdminIntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('nl');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'nl' || stored === 'en' || stored === 'tr') {
        setLocaleState(stored);
      }
    } catch {
      /* SSR / storage unavailable */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
