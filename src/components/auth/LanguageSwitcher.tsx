'use client';

import { useAppLocale } from '@/components/AdminIntlProvider';

const LOCALES = [
  { code: 'nl' as const, label: 'NL' },
  { code: 'en' as const, label: 'EN' },
  { code: 'tr' as const, label: 'TR' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useAppLocale();

  return (
    <div className="flex items-center justify-center gap-1">
      {LOCALES.map(l => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            locale === l.code
              ? 'bg-white/10 text-white'
              : 'text-white/30 hover:text-white/60'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
