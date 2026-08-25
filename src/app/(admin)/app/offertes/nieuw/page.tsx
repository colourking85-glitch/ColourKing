'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { OfferLineKind, TaxCode } from '@/types/database';

type CustomerOption = { id: string; name: string };
type VehicleOption = { id: string; kenteken: string | null; make: string | null; model: string | null; customer_id: string };

type LineItem = {
  tempId: string;
  kind: OfferLineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  discount_pct: number;
  tax_code: TaxCode;
  part_number: string;
};

const KIND_LABELS: Record<OfferLineKind, string> = {
  labour: 'Arbeid',
  part: 'Onderdeel',
  material: 'Materiaal',
  other: 'Overig',
};

const TAX_RATES: Record<TaxCode, number> = {
  H21: 0.21,
  L9: 0.09,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

function emptyLine(): LineItem {
  return {
    tempId: crypto.randomUUID(),
    kind: 'labour',
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price_cents: 0,
    discount_pct: 0,
    tax_code: 'H21',
    part_number: '',
  };
}

function calcLineTotalCents(line: LineItem): number {
  const gross = Math.round(line.quantity * line.unit_price_cents);
  const disc = Math.round(gross * line.discount_pct / 100);
  return gross - disc;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function CreateOfferPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [origin, setOrigin] = useState('manual');
  const [locale, setLocale] = useState('nl');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers);
    fetch('/api/vehicles')
      .then(r => r.ok ? r.json() : [])
      .then(setVehicles);
  }, []);

  const filteredVehicles = vehicles.filter(v => !customerId || v.customer_id === customerId);

  const subtotalCents = lines.reduce((sum, l) => sum + calcLineTotalCents(l), 0);
  const vatCents = lines.reduce((sum, l) => {
    const lt = calcLineTotalCents(l);
    return sum + Math.round(lt * (TAX_RATES[l.tax_code] ?? 0));
  }, 0);
  const totalCents = subtotalCents + vatCents;

  const updateLine = (tempId: string, updates: Partial<LineItem>) => {
    setLines(prev => prev.map(l => l.tempId === tempId ? { ...l, ...updates } : l));
  };

  const removeLine = (tempId: string) => {
    setLines(prev => prev.filter(l => l.tempId !== tempId));
  };

  const handleSave = async () => {
    if (!customerId) { setError('Selecteer een klant'); return; }
    if (lines.length === 0 || lines.every(l => !l.description.trim())) {
      setError('Voeg minstens een regel toe');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Create offer
      const offerRes = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          vehicle_id: vehicleId || null,
          origin,
          locale,
          valid_until: validUntil || null,
          notes: notes || null,
        }),
      });

      if (!offerRes.ok) throw new Error('Kon offerte niet aanmaken');
      const offer = await offerRes.json();

      // Add lines
      const validLines = lines.filter(l => l.description.trim());
      for (let i = 0; i < validLines.length; i++) {
        const l = validLines[i];
        await fetch(`/api/offers/${offer.id}/lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: l.kind,
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unit_price_cents: l.unit_price_cents,
            discount_pct: l.discount_pct,
            tax_code: l.tax_code,
            part_number: l.part_number || null,
            sort_order: i,
          }),
        });
      }

      router.push(`/app/offertes/${offer.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/offertes" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-medium text-ck-text">Nieuwe offerte</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">Maak een concept offerte aan</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Offer details */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Offertegegevens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Klant *</label>
            <select
              value={customerId}
              onChange={e => { setCustomerId(e.target.value); setVehicleId(''); }}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              <option value="">Selecteer klant...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Voertuig</label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              <option value="">Geen voertuig</option>
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.kenteken ?? `${v.make ?? ''} ${v.model ?? ''}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Herkomst</label>
            <select
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              <option value="manual">Handmatig</option>
              <option value="website">Website</option>
              <option value="phone">Telefoon</option>
              <option value="email">E-mail</option>
              <option value="walk_in">Inloop</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Geldig tot</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Taal</label>
            <select
              value={locale}
              onChange={e => setLocale(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="tr">Turkce</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] text-ck-text-muted">Opmerkingen</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              placeholder="Interne opmerkingen..."
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ck-text-muted">Regels</h2>
          <button
            onClick={() => setLines(prev => [...prev, emptyLine()])}
            className="flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border px-3 py-1.5 text-xs text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
          >
            <Plus size={12} />
            Regel toevoegen
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div key={line.tempId} className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] text-ck-text-muted">Regel {idx + 1}</span>
                <button
                  onClick={() => removeLine(line.tempId)}
                  className="text-ck-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <div>
                  <label className="mb-1 block text-[10px] text-ck-text-muted">Type</label>
                  <select
                    value={line.kind}
                    onChange={e => updateLine(line.tempId, { kind: e.target.value as OfferLineKind })}
                    className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                  >
                    {(Object.keys(KIND_LABELS) as OfferLineKind[]).map(k => (
                      <option key={k} value={k}>{KIND_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] text-ck-text-muted">Omschrijving *</label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={e => updateLine(line.tempId, { description: e.target.value })}
                    className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                    placeholder="Omschrijving..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">Aantal</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.quantity}
                      onChange={e => updateLine(line.tempId, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">Stukprijs</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={line.unit_price_cents}
                      onChange={e => updateLine(line.tempId, { unit_price_cents: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                      placeholder="centen"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">Korting %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={line.discount_pct}
                      onChange={e => updateLine(line.tempId, { discount_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-6">
                <div>
                  <label className="mb-1 block text-[10px] text-ck-text-muted">Eenheid</label>
                  <input
                    type="text"
                    value={line.unit}
                    onChange={e => updateLine(line.tempId, { unit: e.target.value })}
                    className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-ck-text-muted">BTW</label>
                  <select
                    value={line.tax_code}
                    onChange={e => updateLine(line.tempId, { tax_code: e.target.value as TaxCode })}
                    className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                  >
                    <option value="H21">21%</option>
                    <option value="L9">9%</option>
                    <option value="N0">0%</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-ck-text-muted">Onderdeelnr.</label>
                  <input
                    type="text"
                    value={line.part_number}
                    onChange={e => updateLine(line.tempId, { part_number: e.target.value })}
                    className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                    placeholder="Optioneel"
                  />
                </div>
                <div className="flex items-end sm:col-span-3">
                  <p className="font-mono text-sm tabular-nums text-ck-text-2">
                    {formatCents(calcLineTotalCents(line))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 border-t border-ck-divider pt-4">
          <div className="flex flex-col items-end gap-1">
            <div className="flex w-48 justify-between text-sm">
              <span className="text-ck-text-muted">Subtotaal</span>
              <span className="font-mono tabular-nums text-ck-text-2">{formatCents(subtotalCents)}</span>
            </div>
            <div className="flex w-48 justify-between text-sm">
              <span className="text-ck-text-muted">BTW</span>
              <span className="font-mono tabular-nums text-ck-text-2">{formatCents(vatCents)}</span>
            </div>
            <div className="flex w-48 justify-between border-t border-ck-divider pt-1 text-sm font-medium">
              <span className="text-ck-text">Totaal</span>
              <span className="font-mono tabular-nums text-ck-text">{formatCents(totalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
