'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

type JobOption = {
  id: string;
  number: number;
  stage: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string; make: string; model: string } | null;
};

export default function CreateHandoverPage() {
  const t = useTranslations('ho');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedJob = searchParams.get('job');

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob ?? '');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.ok ? r.json() : [])
      .then((data: JobOption[]) => {
        const eligible = data.filter(j => ['ready', 'delivered', 'closed'].includes(j.stage));
        setJobs(eligible);
        if (preselectedJob && eligible.some(j => j.id === preselectedJob)) {
          setSelectedJobId(preselectedJob);
        }
      });
  }, [preselectedJob]);

  async function handleCreate() {
    if (!selectedJobId) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/handover-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create');
        setCreating(false);
        return;
      }
      const doc = await res.json();
      router.push(`/app/afleverbon/${doc.id}`);
    } catch {
      setError('Network error');
      setCreating(false);
    }
  }

  const jobOptions = jobs.map(j => ({
    value: j.id,
    label: `#${j.number} — ${j.customers?.name ?? '?'} — ${j.vehicles?.kenteken ?? '?'} (${j.stage})`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-ck-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <ScreenBadge code="DO21" />
        <h1 className="font-display text-2xl font-bold text-white">
          {tNav('createHandover')}
        </h1>
      </div>

      <div className="max-w-lg space-y-4 rounded-xl border border-ck-dark-border bg-ck-dark-card p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase text-ck-muted">
            {t('linkedJob')}
          </label>
          <SearchableSelect
            options={jobOptions}
            value={selectedJobId}
            onChange={setSelectedJobId}
            placeholder={t('selectJob')}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!selectedJobId || creating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ck-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
        >
          <FileCheck size={16} />
          {creating ? tCommon('loading') : tNav('createHandover')}
        </button>
      </div>
    </div>
  );
}
