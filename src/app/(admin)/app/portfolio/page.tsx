'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, ImageOff, Star, Wrench } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { PORTFOLIO_STATUSES } from '@/modules/portfolio/constants';

type Row = {
  id: string;
  dossier_number: string | null;
  status: 'draft' | 'published' | 'archived';
  category: string;
  title_nl: string;
  model_free_text: string | null;
  source: string;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  photo_count: number;
  cover_url: string | null;
  vehicle_brands: { name: string } | null;
  vehicle_models: { name: string } | null;
  jobs: { id: string; number: number } | null;
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-amber-400 bg-amber-400/10',
  published: 'text-green-400 bg-green-400/10',
  archived: 'text-ck-muted bg-ck-dark-surface',
};

export default function PortfolioListPage() {
  const t = useTranslations('pf');
  const tp = useTranslations('portfolio');
  const bcp = ({ nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR' } as Record<string, string>)[useLocale()] ?? 'nl-NL';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/portfolio')
      .then(r => (r.ok ? r.json() : []))
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = status ? rows.filter(r => r.status === status) : rows.filter(r => r.status !== 'archived');
  const count = (s: string) => rows.filter(r => r.status === s).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="PF05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
          {!loading && <span className="rounded-full bg-ck-dark-border px-2.5 py-0.5 text-xs text-ck-muted">{shown.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('refresh')}
          </button>
          <Link href="/app/portfolio/nieuw" className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover">
            <Plus size={16} /> {t('new')}
          </Link>
        </div>
      </div>

      <p className="text-sm text-ck-muted-light">{t('subtitle')}</p>

      <div className="flex flex-wrap gap-1.5">
        {['', ...PORTFOLIO_STATUSES].map(s => (
          <button
            key={s || 'active'}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? 'bg-ck-red/15 text-ck-red ring-1 ring-ck-red/30' : 'bg-ck-dark-card text-ck-muted hover:text-white'}`}
          >
            {s ? `${t(`status_${s}`)} (${count(s)})` : `${t('active')} (${rows.length - count('archived')})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-ck-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border bg-ck-dark-surface text-left text-xs font-semibold uppercase text-ck-muted">
              <th className="px-4 py-3">{t('colPhoto')}</th>
              <th className="px-4 py-3">{t('colDossier')}</th>
              <th className="px-4 py-3">{t('colTitle')}</th>
              <th className="px-4 py-3">{t('colVehicle')}</th>
              <th className="px-4 py-3">{t('colCategory')}</th>
              <th className="px-4 py-3">{t('colStatus')}</th>
              <th className="px-4 py-3 text-right">{t('colPublished')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">{t('empty')}</td></tr>
            ) : shown.map(r => (
              <tr key={r.id} className="border-b border-ck-dark-border/50 bg-ck-dark-card hover:bg-ck-dark-surface/50">
                <td className="px-4 py-2">
                  <Link href={`/app/portfolio/${r.id}`} className="block h-12 w-20 overflow-hidden rounded bg-ck-dark-surface">
                    {r.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-ck-muted"><ImageOff size={16} /></span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-ck-muted-light">
                  {r.dossier_number ?? <span className="italic text-ck-muted">{t('noNumberYet')}</span>}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/app/portfolio/${r.id}`} className="flex items-center gap-1.5 font-medium text-white hover:text-ck-red">
                    {r.featured && <Star size={12} className="fill-amber-400 text-amber-400" />}
                    {r.title_nl || <span className="italic text-ck-muted">{t('untitled')}</span>}
                  </Link>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-ck-muted">
                    {r.photo_count} {t('photosShort')}
                    {r.jobs && <span className="flex items-center gap-1"><Wrench size={10} /> #{r.jobs.number}</span>}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-ck-muted-light">
                  {[r.vehicle_brands?.name, r.vehicle_models?.name ?? r.model_free_text].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-4 py-2 text-xs text-ck-muted-light">{tp(`category.${r.category}`)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{t(`status_${r.status}`)}</span>
                </td>
                <td className="px-4 py-2 text-right text-xs text-ck-muted">
                  {r.published_at ? new Date(r.published_at).toLocaleDateString(bcp, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
