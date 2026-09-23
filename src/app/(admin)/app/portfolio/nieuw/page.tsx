'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wrench, FilePlus2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from '@/modules/portfolio/constants';

type Job = {
  id: string;
  number: number;
  stage: string;
  vehicles: { make: string | null; model: string | null; kenteken: string | null } | null;
  customers: { name: string } | null;
};

export default function NewPortfolioPage() {
  const t = useTranslations('pf');
  const tp = useTranslations('portfolio');
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PortfolioCategory>('bodywork');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => (r.ok ? r.json() : null)).then(me => {
      if (me?.role !== 'admin') return;
      setIsAdmin(true);
      // Completed work orders that don't have a dossier yet
      Promise.all([
        fetch('/api/jobs?stage=delivered').then(r => (r.ok ? r.json() : [])),
        fetch('/api/jobs?stage=closed').then(r => (r.ok ? r.json() : [])),
        fetch('/api/portfolio').then(r => (r.ok ? r.json() : [])),
      ]).then(([delivered, closed, projects]) => {
        const used = new Set((projects as { jobs: { id: string } | null }[]).map(p => p.jobs?.id).filter(Boolean));
        setJobs([...delivered, ...closed].filter((j: Job) => !used.has(j.id)));
      });
    });
  }, []);

  async function createBlank() {
    setBusy('blank');
    setError(null);
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title_nl: title, category }),
    });
    if (res.ok) router.push(`/app/portfolio/${(await res.json()).id}`);
    else { setError(t('saveFailed')); setBusy(null); }
  }

  async function convert(jobId: string) {
    setBusy(jobId);
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/portfolio`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (res.ok) router.push(`/app/portfolio/${json.id}`);
    else if (json.existingId) router.push(`/app/portfolio/${json.existingId}`);
    else { setError(json.error ?? t('saveFailed')); setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/portfolio" className="text-ck-muted hover:text-white"><ArrowLeft size={18} /></Link>
        <ScreenBadge code="PF01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('newTitle')}</h1>
      </div>

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {isAdmin && (
        <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted"><Wrench size={14} /> {t('fromWorkOrder')}</h2>
          <p className="mb-4 text-xs text-ck-muted-light">{t('fromWorkOrderHint')}</p>
          {jobs.length === 0 ? (
            <p className="text-xs italic text-ck-muted">{t('noCompletedJobs')}</p>
          ) : (
            <ul className="divide-y divide-ck-dark-border/60">
              {jobs.map(j => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-white">
                    <span className="font-mono text-ck-muted">#{j.number}</span>{' '}
                    {[j.vehicles?.make, j.vehicles?.model].filter(Boolean).join(' ') || '—'}
                    <span className="ml-2 text-xs text-ck-muted">{j.customers?.name}</span>
                  </span>
                  <button
                    onClick={() => convert(j.id)}
                    disabled={!!busy}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ck-red/40 px-3 py-1.5 text-xs font-semibold text-ck-red hover:bg-ck-red/10 disabled:opacity-50"
                  >
                    {busy === j.id && <Loader2 size={12} className="animate-spin" />}
                    {t('convert')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted"><FilePlus2 size={14} /> {t('blank')}</h2>
        <p className="mb-4 text-xs text-ck-muted-light">{t('blankHint')}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('titleNl')}
            maxLength={200}
            className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
          <select value={category} onChange={e => setCategory(e.target.value as PortfolioCategory)} className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white">
            {PORTFOLIO_CATEGORIES.map(c => <option key={c} value={c}>{tp(`category.${c}`)}</option>)}
          </select>
        </div>
        <button
          onClick={createBlank}
          disabled={!!busy}
          className="mt-4 flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
        >
          {busy === 'blank' && <Loader2 size={14} className="animate-spin" />}
          {t('create')}
        </button>
      </section>
    </div>
  );
}
