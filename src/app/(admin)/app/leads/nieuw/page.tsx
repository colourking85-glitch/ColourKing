'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      router.push(`/app/leads/${lead.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? 'Opslaan mislukt');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="LD01" />
        <h1 className="font-display text-2xl font-bold text-white">Nieuwe lead</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Bron</label>
            <select
              name="source"
              defaultValue="phone"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="website">Website</option>
              <option value="phone">Telefoon</option>
              <option value="email">Email</option>
              <option value="walk_in">Inloop</option>
              <option value="referral">Doorverwijzing</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Taal</label>
            <select
              name="locale"
              defaultValue="nl"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="tr">Turkce</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">Naam *</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Email</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Telefoon</label>
            <input
              name="phone"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Kenteken</label>
            <input
              name="kenteken"
              placeholder="AB-123-C"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 font-mono text-sm uppercase text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Gewenste datum</label>
            <input
              name="preferred_date"
              type="date"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">Schadenomschrijving</label>
          <textarea
            name="damage_description"
            rows={4}
            placeholder="Beschrijf de schade..."
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-6 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-6 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
