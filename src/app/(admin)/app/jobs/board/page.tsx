'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { JOB_STAGES, STAGE_LABELS, STAGE_COLORS, type JobStage } from '@/modules/jobs/machine';

type BoardJob = {
  id: string;
  number: number;
  stage: JobStage;
  job_type: string | null;
  priority: string | null;
  payer_type: string | null;
  notes: string | null;
  created_at: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string; make: string; model: string } | null;
};

const BOARD_STAGES = JOB_STAGES.filter(s => s !== 'closed') as JobStage[];

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-amber-500/20 text-amber-400',
  rush: 'bg-red-500/20 text-red-400',
};

const TYPE_BADGE: Record<string, string> = {
  bodywork: 'text-blue-400',
  mechanical: 'text-cyan-400',
  paint: 'text-purple-400',
  electrical: 'text-yellow-400',
  diagnostics: 'text-orange-400',
  apk: 'text-green-400',
  maintenance: 'text-teal-400',
};

export default function JobBoardPage() {
  const t = useTranslations('jb');
  const tCommon = useTranslations('common');
  const [jobs, setJobs] = useState<BoardJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.ok ? r.json() : [])
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const columns = BOARD_STAGES.map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    color: STAGE_COLORS[stage],
    jobs: jobs.filter(j => j.stage === stage),
  }));

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="JB15" />
          <h1 className="font-display text-2xl font-bold text-white">{t('board')}</h1>
        </div>
        <Link
          href="/app/jobs"
          className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
        >
          {t('listView')}
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.stage} className="w-64 flex-shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs text-ck-muted">{col.jobs.length}</span>
            </div>
            <div className="space-y-2">
              {col.jobs.map(j => (
                <Link
                  key={j.id}
                  href={`/app/jobs/${j.id}`}
                  className={`block rounded-lg border bg-ck-dark-card p-3 hover:border-ck-red/50 ${
                    j.priority === 'rush' ? 'border-red-500/40' :
                    j.priority === 'urgent' ? 'border-amber-500/40' :
                    'border-ck-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium text-white">#{j.number}</span>
                    <span className="text-xs text-ck-muted">
                      {new Date(j.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {j.job_type && (
                      <span className={`text-[10px] font-medium ${TYPE_BADGE[j.job_type] ?? 'text-ck-muted'}`}>
                        {t(`type_${j.job_type}` as 'type_bodywork')}
                      </span>
                    )}
                    {j.priority && j.priority !== 'normal' && (
                      <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[j.priority] ?? ''}`}>
                        {t(`priority_${j.priority}` as 'priority_urgent')}
                      </span>
                    )}
                    {j.payer_type && (
                      <span className="text-[10px] text-ck-muted">
                        {t(`payer_${j.payer_type}` as 'payer_casco')}
                      </span>
                    )}
                  </div>
                  {j.customers && (
                    <div className="mt-1 text-sm text-ck-muted-light">{j.customers.name}</div>
                  )}
                  {j.vehicles && (
                    <div className="mt-0.5 font-mono text-xs text-ck-muted">
                      {j.vehicles.kenteken} — {j.vehicles.make} {j.vehicles.model}
                    </div>
                  )}
                </Link>
              ))}
              {col.jobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-ck-dark-border p-4 text-center text-xs text-ck-muted">
                  {t('empty')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
