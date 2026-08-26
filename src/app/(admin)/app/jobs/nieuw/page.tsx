'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type SelectOption = { id: string; name: string; kenteken?: string; make?: string; model?: string };

export default function CreateJobPage() {
  const t = useTranslations('jb');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_id: '',
    vehicle_id: '',
    intake_km: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { if (Array.isArray(d)) setCustomers(d); });
    fetch('/api/vehicles').then(r => r.json()).then(d => { if (Array.isArray(d)) setVehicles(d); });
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body: Record<string, unknown> = {};
    if (form.customer_id) body.customer_id = form.customer_id;
    if (form.vehicle_id) body.vehicle_id = form.vehicle_id;
    if (form.intake_km) body.intake_km = parseInt(form.intake_km);
    if (form.notes) body.notes = form.notes;

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t('createFailed'));
      setSaving(false);
      return;
    }

    const job = await res.json();
    router.push(`/app/jobs/${job.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="JB01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div>
          <label className="mb-1 block text-sm text-ck-muted-light">{t('customer')}</label>
          <select
            value={form.customer_id}
            onChange={set('customer_id')}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          >
            <option value="">{t('selectCustomerPlaceholder')}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ck-muted-light">{t('vehicle')}</label>
          <select
            value={form.vehicle_id}
            onChange={set('vehicle_id')}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          >
            <option value="">{t('selectVehiclePlaceholder')}</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.kenteken} — {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ck-muted-light">{t('intakeKm')}</label>
          <input
            type="number"
            value={form.intake_km}
            onChange={set('intake_km')}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ck-muted-light">{t('notes')}</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? tCommon('saving') : t('createJob')}
          </button>
        </div>
      </form>
    </div>
  );
}
