'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { Upload, X } from 'lucide-react';

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export default function NewLeadPage() {
  const t = useTranslations('ld');
  const tCommon = useTranslations('common');
  const tKl = useTranslations('kl');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      contact_name: fd.get('name') as string,
      contact_email: fd.get('email') || null,
      contact_phone: fd.get('phone') || null,
      kenteken: fd.get('kenteken') || null,
      damage_description: fd.get('damage_description') || null,
      preferred_date: fd.get('preferred_date') || null,
      origin: fd.get('source') as string,
      locale: fd.get('locale') as string,
    };

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const lead = await res.json();

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        await fetch(`/api/leads/${lead.id}/photos`, { method: 'POST', body: fd });
      }

      router.push(`/app/leads/${lead.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files];
    for (let i = 0; i < selected.length && next.length < MAX_FILES; i++) {
      const f = selected[i];
      if (f.type && !f.type.startsWith('image/')) continue;
      next.push(f);
    }
    const total = next.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) return;
    setFiles(next);
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="LD01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('source')}</label>
            <select
              name="source"
              defaultValue="phone"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="website">{t('website')}</option>
              <option value="phone">{t('phone')}</option>
              <option value="email">{t('email')}</option>
              <option value="walk_in">{t('walk_in')}</option>
              <option value="referral">{t('referral')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{tKl('locale')}</label>
            <select
              name="locale"
              defaultValue="nl"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="nl">{t('languageNl')}</option>
              <option value="en">{t('languageEn')}</option>
              <option value="tr">{t('languageTr')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('nameRequired')}</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('email')}</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('phone')}</label>
            <input
              name="phone"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('kenteken')}</label>
            <input
              name="kenteken"
              placeholder="AB-123-C"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 font-mono text-sm uppercase text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('preferredDate')}</label>
            <input
              name="preferred_date"
              type="date"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('damage')}</label>
          <textarea
            name="damage_description"
            rows={4}
            placeholder={t('damagePlaceholder')}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('photos')} ({files.length}/{MAX_FILES})</label>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-ck-dark-border">
                <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-0.5 top-0.5 rounded bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ck-dark-border text-ck-muted hover:border-ck-red hover:text-ck-red transition-colors"
              >
                <Upload size={16} />
                <span className="text-[9px]">{t('addPhoto')}</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
          />
          <p className="mt-1 text-[10px] text-ck-muted">{t('photosHint')}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-6 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-6 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
