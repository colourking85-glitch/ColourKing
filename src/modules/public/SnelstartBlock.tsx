'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SnelstartBlock() {
  const t = useTranslations('pub.snelstart');
  const router = useRouter();
  const [kenteken, setKenteken] = useState('');

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const plate = kenteken.replace(/[-\s]/g, '').toUpperCase();
    if (plate.length >= 4) {
      router.push(`/offerte?kenteken=${encodeURIComponent(plate)}`);
    }
  }

  return (
    <section className="border-b border-ck-border bg-ck-bg">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-ck-text sm:text-2xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-ck-text-muted">{t('subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
            <input
              type="text"
              value={kenteken}
              onChange={(e) => setKenteken(e.target.value.toUpperCase())}
              placeholder={t('placeholder')}
              className="w-full border border-ck-border bg-ck-surface px-4 py-3 font-mono text-sm tracking-widest text-ck-text placeholder-ck-text-faint outline-none transition-colors focus:border-ck-red/50 sm:w-48"
            />
            <button
              type="submit"
              className="whitespace-nowrap bg-ck-red px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
            >
              {t('button')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
