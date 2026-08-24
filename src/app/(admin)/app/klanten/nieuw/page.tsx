'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

export default function NewCustomerPage() {
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
      setError(err.error ?? 'Opslaan mislukt');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="KL01" />
        <h1 className="font-display text-2xl font-bold text-white">Nieuwe klant</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Type</label>
            <select
              name="type"
              defaultValue="private"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            >
              <option value="private">Particulier</option>
              <option value="company">Bedrijf</option>
              <option value="fleet">Wagenpark</option>
              <option value="dealer">Dealer</option>
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

        <div>
          <label className="mb-1 block text-xs text-ck-muted">Adres</label>
          <input
            name="address"
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Postcode</label>
            <input
              name="postcode"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">Stad</label>
            <input
              name="city"
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">BTW-nummer</label>
          <input
            name="btw_number"
            placeholder="NL..."
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">Notities</label>
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
