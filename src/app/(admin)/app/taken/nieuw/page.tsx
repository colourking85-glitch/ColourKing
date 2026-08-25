'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

export default function NewTaskPage() {
  const t = useTranslations('tk');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    job_id: '',
    title: '',
    description: '',
    assigned_to: '',
    estimated_minutes: '',
    offer_line_id: '',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        job_id: form.job_id,
        title: form.title,
      };
      if (form.description) body.description = form.description;
      if (form.assigned_to) body.assigned_to = form.assigned_to;
      if (form.estimated_minutes) body.estimated_minutes = parseInt(form.estimated_minutes, 10);
      if (form.offer_line_id) body.offer_line_id = form.offer_line_id;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? tc('saveFailed'));
      }

      router.push('/app/taken');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="TS01" />
        <div>
          <h1 className="text-base font-medium text-ck-text">{t('createTask')}</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            {t('newTaskDesc')}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-6 space-y-4">
          {/* Job ID */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('jobId')}
            </label>
            <input
              type="text"
              required
              value={form.job_id}
              onChange={e => update('job_id', e.target.value)}
              placeholder={t('jobIdPlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('taskTitleLabel')}
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder={t('taskTitlePlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none resize-none"
            />
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('assigneeLabel')}
            </label>
            <input
              type="text"
              value={form.assigned_to}
              onChange={e => update('assigned_to', e.target.value)}
              placeholder={t('assigneePlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
            />
          </div>

          {/* Estimated minutes */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('estimatedTimeLabel')}
            </label>
            <input
              type="number"
              min={0}
              value={form.estimated_minutes}
              onChange={e => update('estimated_minutes', e.target.value)}
              placeholder="0"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
            />
          </div>

          {/* Offer line id */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ck-text-muted mb-1.5">
              {t('offerLineIdLabel')}
            </label>
            <input
              type="text"
              value={form.offer_line_id}
              onChange={e => update('offer_line_id', e.target.value)}
              placeholder={t('offerLineIdPlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text hover:bg-ck-surface-2 transition-colors"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? tc('saving') : t('createTask')}
          </button>
        </div>
      </form>
    </div>
  );
}
