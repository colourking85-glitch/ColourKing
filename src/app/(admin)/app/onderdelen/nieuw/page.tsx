'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type JobOption = {
  id: string;
  job_number: string | null;
};

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function NewPartPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<JobOption[]>([]);

  const [quantity, setQuantity] = useState(1);
  const [unitPriceEuros, setUnitPriceEuros] = useState('');

  const unitPriceCents = useMemo(() => {
    const parsed = parseFloat(unitPriceEuros.replace(',', '.'));
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }, [unitPriceEuros]);

  const totalCents = quantity * unitPriceCents;

  useEffect(() => {
    fetch('/api/jobs?limit=200')
      .then(r => r.ok ? r.json() : [])
      .then((data: JobOption[]) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      job_id: fd.get('job_id') as string,
      description: fd.get('description') as string,
      part_number: fd.get('part_number') || null,
      supplier: fd.get('supplier') || null,
      quantity,
      unit_price_cents: unitPriceCents,
      blocking: fd.get('blocking') === 'on',
      notes: fd.get('notes') || null,
    };

    const res = await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/app/onderdelen');
    } else {
      const err = await res.json();
      setError(err.error ?? 'Opslaan mislukt');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="PT01" />
        <h1 className="text-base font-medium text-ck-text">Nieuw onderdeel</h1>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-6">
        <div>
          <label className="mb-1 block text-[11px] text-ck-text-muted">Opdracht *</label>
          <select
            name="job_id"
            required
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">Selecteer opdracht...</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.job_number ?? j.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-ck-text-muted">Omschrijving *</label>
          <input
            name="description"
            required
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Artikelnummer</label>
            <input
              name="part_number"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 font-mono text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Leverancier</label>
            <input
              name="supplier"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Aantal</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Stukprijs (EUR)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={unitPriceEuros}
              onChange={e => setUnitPriceEuros(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Totaal</label>
            <div className="flex h-[38px] items-center rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-3 px-3 text-sm text-ck-text-2">
              {formatEuros(totalCents)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="blocking"
            id="blocking"
            className="h-4 w-4 rounded border-ck-border bg-ck-surface-2 text-ck-red focus:ring-ck-red"
          />
          <label htmlFor="blocking" className="text-sm text-ck-text">
            Blokkerend onderdeel (voorkomt statuswijziging opdracht)
          </label>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-ck-text-muted">Notities</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Opmerkingen..."
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-ck-red px-6 py-2 text-sm font-medium text-white hover:bg-ck-red-hover disabled:opacity-50 transition-colors"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-[10px] border-[0.5px] border-ck-border px-6 py-2 text-sm text-ck-text-muted hover:text-ck-text transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
