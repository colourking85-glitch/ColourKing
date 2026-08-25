'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

export default function NewVehiclePage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCustomer = searchParams.get('customer');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [kentekenInput, setKentekenInput] = useState('');
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwData, setRdwData] = useState<Record<string, string | number | boolean | null> | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState(presetCustomer ?? '');

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers);
  }, []);

  async function lookupRdw() {
    if (!kentekenInput.trim()) return;
    setRdwLoading(true);
    setError('');
    const res = await fetch(`/api/rdw?kenteken=${encodeURIComponent(kentekenInput)}`);
    if (res.ok) {
      setRdwData(await res.json());
    } else {
      setError(t('rdwNotFound'));
      setRdwData(null);
    }
    setRdwLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      customer_id: customerId,
      kenteken: fd.get('kenteken') || null,
      vin: fd.get('vin') || null,
      make: fd.get('make') || null,
      model: fd.get('model') || null,
      year: fd.get('year') ? Number(fd.get('year')) : null,
      colour: fd.get('colour') || null,
      paint_code: fd.get('paint_code') || null,
      fuel: fd.get('fuel') || null,
      body_type: fd.get('body_type') || null,
      wok: fd.get('wok') === 'on',
      rdw_snapshot: rdwData?.rdw_snapshot ?? null,
    };

    if (!body.customer_id) {
      setError(t('selectOwner'));
      setSaving(false);
      return;
    }

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const vehicle = await res.json();
      router.push(`/app/voertuigen/${vehicle.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="VH01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-ck-muted">{t('rdwLookup').toUpperCase()}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('registrationExample')}
            value={kentekenInput}
            onChange={e => setKentekenInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupRdw())}
            className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 font-mono text-sm uppercase text-white focus:border-ck-red focus:outline-none"
          />
          <button
            type="button"
            onClick={lookupRdw}
            disabled={rdwLoading}
            className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            <Search size={14} />
            {rdwLoading ? t('lookingUp') : t('rdwLookup')}
          </button>
        </div>
        {rdwData && (
          <p className="mt-2 text-xs text-green-400">
            {t('found')} {rdwData.make} {rdwData.model} ({rdwData.year}) — {rdwData.colour}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div>
          <label className="mb-1 block text-xs text-ck-muted">{tCommon('customer')} *</label>
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          >
            <option value="">{t('selectOwner')}...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('kenteken')}</label>
            <input
              name="kenteken"
              defaultValue={rdwData?.kenteken as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 font-mono text-sm uppercase text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('vin')}</label>
            <input
              name="vin"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('make')}</label>
            <input
              name="make"
              defaultValue={rdwData?.make as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('model')}</label>
            <input
              name="model"
              defaultValue={rdwData?.model as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('year')}</label>
            <input
              name="year"
              type="number"
              defaultValue={rdwData?.year as number ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('colour')}</label>
            <input
              name="colour"
              defaultValue={rdwData?.colour as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('paintCode')}</label>
            <input
              name="paint_code"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('fuel')}</label>
            <input
              name="fuel"
              defaultValue={rdwData?.fuel as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('bodyType')}</label>
            <input
              name="body_type"
              defaultValue={rdwData?.body_type as string ?? ''}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-ck-muted-light">
              <input
                name="wok"
                type="checkbox"
                defaultChecked={rdwData?.wok as boolean ?? false}
                className="rounded border-ck-dark-border bg-ck-dark-surface"
              />
              {t('wok')}
            </label>
          </div>
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
