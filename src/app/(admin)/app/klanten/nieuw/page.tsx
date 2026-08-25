'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

export default function NewCustomerPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      type: fd.get('type') as string,
      name: fd.get('name') as string,
      email: fd.get('email') || null,
      phone: fd.get('phone') || null,
      address: fd.get('address') || null,
      postcode: fd.get('postcode') || null,
      city: fd.get('city') || null,
      btw_number: fd.get('btw_number') || null,
      locale: fd.get('locale') as string,
      notes: fd.get('notes') || null,
    };

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const customer = await res.json();
      router.push(`/app/klanten/${customer.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="KL01" />
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
            <label className="mb-1 block text-xs text-ck-muted">{t('type')}</label>
            <select
              name="type"
              defaultValue="private"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="private">{t('private')}</option>
              <option value="company">{t('company')}</option>
              <option value="fleet">{t('fleet')}</option>
              <option value="dealer">{t('dealer')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('locale')}</label>
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

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('address')}</label>
          <input
            name="address"
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('postcode')}</label>
            <input
              name="postcode"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('city')}</label>
            <input
              name="city"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('vatNumber')}</label>
          <input
            name="btw_number"
            placeholder="NL..."
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('notes')}</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
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
