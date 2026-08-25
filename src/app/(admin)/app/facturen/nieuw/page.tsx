'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FileText } from 'lucide-react';

type OfferOption = {
  id: string;
  offer_number: string | null;
  status: string;
  total_cents: number;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  offer_lines: Array<{
    id: string;
    kind: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price_cents: number;
    discount_pct: number;
    line_total_cents: number;
    tax_code: string;
    vat_amount_cents: number;
  }>;
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<OfferOption | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [terms, setTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Set default due date (30 days from now)
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  // Load approved offers
  useEffect(() => {
    fetch('/api/offers?status=approved')
      .then(r => r.ok ? r.json() : [])
      .then(setOffers)
      .finally(() => setLoadingOffers(false));
  }, []);

  // Load selected offer details
  useEffect(() => {
    if (!selectedOfferId) {
      setSelectedOffer(null);
      return;
    }
    fetch(`/api/offers/${selectedOfferId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setSelectedOffer);
  }, [selectedOfferId]);

  const handleSave = async () => {
    if (!selectedOfferId) {
      setError('Selecteer een offerte');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: selectedOfferId,
          due_date: dueDate || null,
          terms: terms || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kon factuur niet aanmaken');
      }

      const invoice = await res.json();
      router.push(`/app/facturen/${invoice.id}`);
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
          <Link href="/app/facturen" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-medium text-ck-text">Nieuwe factuur</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">Maak een factuur van een goedgekeurde offerte</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selectedOfferId}
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Aanmaken...' : 'Factuur aanmaken'}
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Offer selection */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Offerte selecteren</h2>

        {loadingOffers ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2">
            <FileText size={24} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">Geen goedgekeurde offertes beschikbaar</p>
          </div>
        ) : (
          <select
            value={selectedOfferId}
            onChange={e => setSelectedOfferId(e.target.value)}
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">Selecteer een offerte...</option>
            {offers.map(o => (
              <option key={o.id} value={o.id}>
                {o.offer_number ?? 'CONCEPT'} — {o.customers?.name ?? 'Onbekend'} — {formatCents(o.total_cents)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Preview lines from offer */}
      {selectedOffer && selectedOffer.offer_lines && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Offerteregels (worden overgenomen)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ck-border text-left text-[10px] uppercase tracking-wider text-ck-text-muted">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Omschrijving</th>
                  <th className="pb-2 pr-3 font-medium text-right">Aantal</th>
                  <th className="pb-2 pr-3 font-medium text-right">Stukprijs</th>
                  <th className="pb-2 pr-3 font-medium text-right">BTW</th>
                  <th className="pb-2 font-medium text-right">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOffer.offer_lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-ck-divider last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs tabular-nums text-ck-text-muted">{idx + 1}</td>
                    <td className="py-2 pr-3 text-sm text-ck-text-2">{line.description}</td>
                    <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-3">
                      {Number(line.quantity)} {line.unit}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-3">
                      {formatCents(line.unit_price_cents)}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-muted">
                      {formatCents(line.vat_amount_cents)}
                    </td>
                    <td className="py-2 text-right font-mono text-sm tabular-nums text-ck-text-2">
                      {formatCents(line.line_total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice settings */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Factuurinstellingen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">Vervaldatum</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] text-ck-text-muted">Betalingsvoorwaarden</label>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              placeholder="Betaling binnen 30 dagen na factuurdatum..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
