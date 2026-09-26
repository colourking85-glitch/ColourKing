'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarOff } from 'lucide-react';

type Closure = { title: string; start_date: string; end_date: string };

const BCP: Record<string, string> = { nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR' };

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Site-wide strip when the company is closed today or within the next 7 days. */
export function ClosureBanner() {
  const t = useTranslations('pub.closure');
  const bcp = BCP[useLocale()] ?? 'nl-NL';
  const [closure, setClosure] = useState<Closure | null>(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + 7);
    setToday(ymd(now));
    fetch(`/api/public/closures?from=${ymd(now)}&to=${ymd(until)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Closure[]) => setClosure(rows[0] ?? null))
      .catch(() => {});
  }, []);

  if (!closure) return null;

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(bcp, { day: 'numeric', month: 'long' });
  const range = closure.start_date === closure.end_date ? fmt(closure.start_date) : `${fmt(closure.start_date)} – ${fmt(closure.end_date)}`;
  const active = closure.start_date <= today && closure.end_date >= today;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
      <CalendarOff size={14} className="mr-1.5 inline -mt-0.5" />
      {active ? t('closedNow', { range, title: closure.title }) : t('closedSoon', { range, title: closure.title })}
    </div>
  );
}
