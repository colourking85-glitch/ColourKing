'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { JOB_STAGES, STAGE_LABELS, STAGE_COLORS, type JobStage } from '@/modules/jobs/machine';

type Job = {
  id: string;
  number: number;
  stage: JobStage;
  notes: string | null;
  created_at: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string; make: string; model: string; colour: string } | null;
};

export default function JobsPage() {
  const t = useTranslations('jb');
  const tCommon = useTranslations('common');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stageFilter) params.set('stage', stageFilter);
    fetch(`/api/jobs?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setJobs)
      .finally(() => setLoading(false));
  }, [search, stageFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="JB05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/jobs/board"
            className="flex items-center gap-2 rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
          >
            <LayoutGrid size={16} />
            {t('board')}
          </Link>
          <Link
            href="/app/jobs/nieuw"
            className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
          >
            <Plus size={16} />
            {t('new')}
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
        >
          <option value="">{t('allStages')}</option>
          {JOB_STAGES.map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">
            {search || stageFilter ? t('noJobsFound') : t('noJobsMessage')}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
                <th className="px-4 py-3">{t('number')}</th>
                <th className="px-4 py-3">{t('stage')}</th>
                <th className="px-4 py-3">{t('customer')}</th>
                <th className="px-4 py-3">{t('vehicle')}</th>
                <th className="px-4 py-3">{t('created')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                  <td className="px-4 py-3">
                    <Link href={`/app/jobs/${j.id}`} className="font-mono font-medium text-white hover:text-ck-red">
                      #{j.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[j.stage]}`}>
                      {STAGE_LABELS[j.stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">
                    {j.customers?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">
                    {j.vehicles ? `${j.vehicles.kenteken} — ${j.vehicles.make} ${j.vehicles.model}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted">
                    {new Date(j.created_at).toLocaleDateString('nl-NL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
