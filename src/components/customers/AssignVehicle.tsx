'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link2, X } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

type VehicleOption = {
  id: string;
  kenteken: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  customer_id: string | null;
  customers: { id: string; name: string } | null;
};

/** "Voertuig koppelen": pick an existing vehicle and set this customer as its owner. */
export function AssignVehicle({ customerId, onAssigned }: { customerId: string; onAssigned: () => void }) {
  const t = useTranslations('kl');
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/vehicles')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: VehicleOption[]) => setVehicles(rows.filter((v) => v.customer_id !== customerId)))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [open, customerId]);

  const options = vehicles.map((v) => ({
    value: v.id,
    label: `${v.kenteken ?? '—'} · ${[v.make, v.model, v.year].filter(Boolean).join(' ')}${v.customers ? ` (${t('assignVehicleOwnedBy', { name: v.customers.name })})` : ''}`,
  }));

  async function assign(vehicleId: string) {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    if (v.customers && !window.confirm(t('assignVehicleConfirm', { plate: v.kenteken ?? '', name: v.customers.name }))) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId }),
    });
    if (res.ok) {
      setOpen(false);
      onAssigned();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? 'Error');
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-ck-red hover:text-ck-red-hover">
        <Link2 size={12} /> {t('assignVehicle')}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-72">
        {loading ? (
          <span className="text-xs text-ck-muted">…</span>
        ) : (
          <SearchableSelect
            options={options}
            value=""
            onChange={(val) => assign(val)}
            placeholder={t('assignVehiclePlaceholder')}
            searchPlaceholder={t('assignVehicleSearch')}
          />
        )}
      </div>
      <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded p-1 text-ck-muted hover:text-white">
        <X size={14} />
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
