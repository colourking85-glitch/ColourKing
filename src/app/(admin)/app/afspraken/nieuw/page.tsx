'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { AppointmentType } from '@/types/database';

type SlotData = {
  time: string;
  available: boolean;
  resource_ids: string[];
};

type ResourceRow = {
  id: string;
  type: string;
  name: string;
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  inspection: 'Inspectie',
  drop_off: 'Afleveren',
  collection: 'Ophalen',
  repair_slot: 'Reparatie',
};

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 uur' },
  { value: 90, label: '1,5 uur' },
  { value: 120, label: '2 uur' },
  { value: 180, label: '3 uur' },
  { value: 240, label: '4 uur' },
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<AppointmentType>('inspection');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load resources on mount
  useEffect(() => {
    fetch('/api/resources')
      .then(r => r.ok ? r.json() : [])
      .then(setResources);
  }, []);

  // Load available slots when date or type changes
  useEffect(() => {
    if (!date || !type) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/appointments/slots?date=${date}&type=${type}`)
      .then(r => r.ok ? r.json() : [])
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [date, type]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      type,
      contact_name: fd.get('contact_name') as string,
      contact_phone: fd.get('contact_phone') || null,
      contact_email: fd.get('contact_email') || null,
      scheduled_date: date,
      scheduled_time: fd.get('scheduled_time') as string,
      duration_minutes: Number(fd.get('duration_minutes')),
      resource_id: fd.get('resource_id') || null,
      customer_id: fd.get('customer_id') || null,
      vehicle_id: fd.get('vehicle_id') || null,
      notes: fd.get('notes') || null,
    };

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/app/afspraken');
    } else {
      const err = await res.json();
      setError(err.error ?? 'Opslaan mislukt');
      setSaving(false);
    }
  }

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="AP01" />
        <div>
          <h1 className="text-base font-medium text-ck-text">Nieuwe afspraak</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            Plan een inspectie, aflevering, ophaalmoment of reparatie
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-6">
        {/* Type */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Type afspraak *</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(TYPE_LABELS) as AppointmentType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-[10px] border-[0.5px] px-3 py-2 text-sm transition-colors ${
                  type === t
                    ? 'border-ck-red bg-ck-red/10 text-ck-red'
                    : 'border-ck-border bg-ck-surface-2 text-ck-text-2 hover:border-ck-text-muted'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Contactnaam *</label>
          <input
            name="contact_name"
            required
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Telefoon</label>
            <input
              name="contact_phone"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Email</label>
            <input
              name="contact_email"
              type="email"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Datum *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Tijd *</label>
            {loadingSlots ? (
              <div className="flex h-[38px] items-center rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
                <span className="ml-2 text-sm text-ck-text-muted">Laden...</span>
              </div>
            ) : (
              <select
                name="scheduled_time"
                required
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
              >
                {!date && <option value="">Kies eerst een datum</option>}
                {date && availableSlots.length === 0 && (
                  <option value="">Geen beschikbare tijden</option>
                )}
                {availableSlots.map(s => (
                  <option key={s.time} value={s.time}>{s.time}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Duur</label>
            <select
              name="duration_minutes"
              defaultValue={type === 'repair_slot' ? 60 : 30}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              {DURATION_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Resource</label>
            <select
              name="resource_id"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              <option value="">Automatisch</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional links */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Klant-ID (optioneel)</label>
            <input
              name="customer_id"
              placeholder="UUID"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 font-mono text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Voertuig-ID (optioneel)</label>
            <input
              name="vehicle_id"
              placeholder="UUID"
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 font-mono text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ck-text-muted">Notities</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Extra informatie..."
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          />
        </div>

        {/* Available slots info */}
        {date && !loadingSlots && (
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface-2 px-4 py-3">
            <p className="text-[11px] text-ck-text-muted">
              {availableSlots.length} beschikbare tijdsloten op{' '}
              {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        )}

        {/* Actions */}
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
            className="rounded-[10px] border-[0.5px] border-ck-border px-6 py-2 text-sm text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
