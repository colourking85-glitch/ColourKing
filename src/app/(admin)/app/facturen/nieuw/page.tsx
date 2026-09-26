'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, FileText, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { OfferLineKind, TaxCode } from '@/types/database';

type CustomerOption = { id: string; name: string; locale?: string };
type VehicleOption = { id: string; kenteken: string | null; make: string | null; model: string | null; customer_id: string; customers?: { id: string; name: string } | null };
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

type LineItem = {
  tempId: string;
  kind: OfferLineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  discount_pct: number;
  tax_code: TaxCode;
};

const TAX_RATES: Record<TaxCode, number> = {
  H21: 0.21, L9: 0.09, N0: 0, V0: 0, M0: 0, ICP: 0, EX: 0,
};

const KINDS: OfferLineKind[] = ['labour', 'part', 'material', 'other'];

type InvoiceType = 'standard' | 'deposit';
type CreateMode = 'offer' | 'standalone';

export default function CreateInvoicePage() {
  const t = useTranslations('fa');
  const tc = useTranslations('common');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);
  const router = useRouter();

  const [mode, setMode] = useState<CreateMode>('standalone');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('standard');
  const [invoiceLocale, setInvoiceLocale] = useState<string>(locale);
  const [dueDate, setDueDate] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Offer mode
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<OfferOption | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Standalone mode
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [allVehicles, setAllVehicles] = useState<VehicleOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetch('/api/offers?status=approved')
      .then(r => r.ok ? r.json() : [])
      .then(setOffers)
      .finally(() => setLoadingOffers(false));
  }, []);

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.ok ? r.json() : [])
      .then(setAllVehicles);
  }, []);

  useEffect(() => {
    if (!customerId) { setVehicles([]); return; }
    setVehicles(allVehicles.filter(v => v.customer_id === customerId));
  }, [customerId, allVehicles]);

  useEffect(() => {
    if (!selectedOfferId) { setSelectedOffer(null); return; }
    fetch(`/api/offers/${selectedOfferId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setSelectedOffer);
  }, [selectedOfferId]);

  const addLine = () => {
    setLines(prev => [...prev, {
      tempId: crypto.randomUUID(),
      kind: 'labour',
      description: '',
      quantity: 1,
      unit: 'st',
      unit_price_cents: 0,
      discount_pct: 0,
      tax_code: 'H21',
    }]);
  };

  const updateLine = (tempId: string, field: string, value: unknown) => {
    setLines(prev => prev.map(l => l.tempId === tempId ? { ...l, [field]: value } : l));
  };

  const removeLine = (tempId: string) => {
    setLines(prev => prev.filter(l => l.tempId !== tempId));
  };

  const calcLineTotal = (line: LineItem) => {
    const gross = Math.round(line.quantity * line.unit_price_cents);
    const disc = Math.round(gross * line.discount_pct / 100);
    return gross - disc;
  };

  const calcLineVat = (line: LineItem) => {
    const total = calcLineTotal(line);
    return Math.round(total * (TAX_RATES[line.tax_code] ?? 0));
  };

  const subtotal = lines.reduce((s, l) => s + calcLineTotal(l), 0);
  const vatTotal = lines.reduce((s, l) => s + calcLineVat(l), 0);
  const grandTotal = subtotal + vatTotal;

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (mode === 'offer') {
        if (!selectedOfferId) { setError(t('selectOffer')); setSaving(false); return; }
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offer_id: selectedOfferId,
            due_date: dueDate || null,
            terms: terms || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || tc('saveFailed'));
        const invoice = await res.json();
        if (invoiceType === 'deposit' && notes) {
          await fetch(`/api/invoices/${invoice.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
        }
        router.push(`/app/facturen/${invoice.id}`);
      } else {
        if (!customerId) { setError(t('selectCustomer')); setSaving(false); return; }
        if (lines.length === 0) { setError(t('addAtLeastOneLine')); setSaving(false); return; }

        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customerId,
            vehicle_id: vehicleId || null,
            locale: invoiceLocale,
            due_date: dueDate || null,
            terms: terms || null,
            notes: notes || null,
            invoice_type: invoiceType,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || tc('saveFailed'));
        const invoice = await res.json();

        for (const line of lines) {
          await fetch(`/api/invoices/${invoice.id}/lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: line.kind,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unit_price_cents: line.unit_price_cents,
              discount_pct: line.discount_pct,
              tax_code: line.tax_code,
            }),
          });
        }

        router.push(`/app/facturen/${invoice.id}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const canSave = mode === 'offer' ? !!selectedOfferId : (!!customerId && lines.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/facturen" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-medium text-ck-text">{t('new')}</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              {invoiceType === 'deposit' ? t('depositInvoice') : t('standardInvoice')}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? t('creating') : t('createInvoice')}
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Mode + Type selector */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('createMethod')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('standalone')}
                className={`flex-1 rounded-[10px] border-[0.5px] px-3 py-2 text-sm transition-colors ${
                  mode === 'standalone'
                    ? 'border-ck-red bg-ck-red/10 text-ck-red font-medium'
                    : 'border-ck-border text-ck-text-3 hover:border-ck-text-muted'
                }`}
              >
                {t('standalone')}
              </button>
              <button
                onClick={() => setMode('offer')}
                className={`flex-1 rounded-[10px] border-[0.5px] px-3 py-2 text-sm transition-colors ${
                  mode === 'offer'
                    ? 'border-ck-red bg-ck-red/10 text-ck-red font-medium'
                    : 'border-ck-border text-ck-text-3 hover:border-ck-text-muted'
                }`}
              >
                {t('fromOffer')}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('invoiceTypeLabel')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setInvoiceType('standard')}
                className={`flex-1 rounded-[10px] border-[0.5px] px-3 py-2 text-sm transition-colors ${
                  invoiceType === 'standard'
                    ? 'border-ck-red bg-ck-red/10 text-ck-red font-medium'
                    : 'border-ck-border text-ck-text-3 hover:border-ck-text-muted'
                }`}
              >
                {t('standardInvoice')}
              </button>
              <button
                onClick={() => setInvoiceType('deposit')}
                className={`flex-1 rounded-[10px] border-[0.5px] px-3 py-2 text-sm transition-colors ${
                  invoiceType === 'deposit'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
                    : 'border-ck-border text-ck-text-3 hover:border-ck-text-muted'
                }`}
              >
                {t('depositInvoice')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* From Offer mode */}
      {mode === 'offer' && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('selectOffer')}</h2>
          {loadingOffers ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
            </div>
          ) : offers.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-2">
              <FileText size={24} className="text-ck-text-faint" />
              <p className="text-sm text-ck-text-muted">{t('noApprovedOffers')}</p>
            </div>
          ) : (
            <SearchableSelect
              options={offers.map(o => ({
                value: o.id,
                label: `${o.offer_number ?? t('draft')} — ${o.customers?.name ?? tc('unknown')} — ${formatCents(o.total_cents)}`,
              }))}
              value={selectedOfferId}
              onChange={(val) => setSelectedOfferId(val)}
              placeholder={t('selectOfferPlaceholder')}
              searchPlaceholder={t('searchOfferPlaceholder')}
            />
          )}
        </div>
      )}

      {/* Offer preview lines */}
      {mode === 'offer' && selectedOffer?.offer_lines && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('offerLines')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ck-border text-left text-[10px] uppercase tracking-wider text-ck-text-muted">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">{t('description')}</th>
                  <th className="pb-2 pr-3 font-medium text-right">{t('quantity')}</th>
                  <th className="pb-2 pr-3 font-medium text-right">{t('unitPrice')}</th>
                  <th className="pb-2 pr-3 font-medium text-right">{t('vat')}</th>
                  <th className="pb-2 font-medium text-right">{t('total')}</th>
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

      {/* Standalone mode: customer + vehicle */}
      {mode === 'standalone' && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('customer')}</h2>
          {loadingCustomers ? (
            <div className="flex h-16 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] text-ck-text-muted">{t('customer')}</label>
                <SearchableSelect
                  options={customers.map(c => ({ value: c.id, label: c.name }))}
                  value={customerId}
                  onChange={(val) => {
                    setCustomerId(val);
                    setVehicleId('');
                    const c = customers.find(x => x.id === val);
                    if (c?.locale) setInvoiceLocale(c.locale);
                  }}
                  placeholder={t('selectCustomer')}
                  searchPlaceholder={t('searchCustomer')}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ck-text-muted">{t('searchByPlate')}</label>
                <SearchableSelect
                  options={allVehicles.map(v => ({
                    value: v.id,
                    label: `${v.kenteken ?? '—'} · ${[v.make, v.model].filter(Boolean).join(' ')}${v.customers ? ` (${v.customers.name})` : ''}`,
                  }))}
                  value={vehicleId}
                  onChange={(val) => {
                    setVehicleId(val);
                    const v = allVehicles.find(x => x.id === val);
                    if (v?.customer_id) {
                      setCustomerId(v.customer_id);
                      const c = customers.find(x => x.id === v.customer_id);
                      if (c?.locale) setInvoiceLocale(c.locale);
                    }
                  }}
                  placeholder={t('searchPlate')}
                  searchPlaceholder={t('searchPlatePlaceholder')}
                />
              </div>
              {vehicles.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] text-ck-text-muted">{t('vehicle')}</label>
                  <SearchableSelect
                    options={vehicles.map(v => ({
                      value: v.id,
                      label: v.kenteken ?? `${v.make ?? ''} ${v.model ?? ''}`,
                    }))}
                    value={vehicleId}
                    onChange={(val) => setVehicleId(val)}
                    placeholder={tc('optional')}
                    searchPlaceholder={t('searchPlatePlaceholder')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Standalone mode: line items */}
      {mode === 'standalone' && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('lines')}</h2>
            <button
              onClick={addLine}
              className="flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-xs text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
            >
              <Plus size={12} />
              {t('addLine')}
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-2">
              <FileText size={24} className="text-ck-text-faint" />
              <p className="text-sm text-ck-text-muted">{t('noLinesYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={line.tempId} className="rounded-lg border-[0.5px] border-ck-border bg-ck-bg p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs tabular-nums text-ck-text-muted">#{idx + 1}</span>
                    <button
                      onClick={() => removeLine(line.tempId)}
                      className="text-ck-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-[10px] text-ck-text-muted">{t('description')}</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={e => updateLine(line.tempId, 'description', e.target.value)}
                        className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2.5 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
                        placeholder={t('lineDescPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-ck-text-muted">{t('quantity')}</label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={e => updateLine(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2.5 py-1.5 text-sm text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                        min={0}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-ck-text-muted">{t('unitPrice')} (€)</label>
                      <input
                        type="number"
                        value={line.unit_price_cents / 100}
                        onChange={e => updateLine(line.tempId, 'unit_price_cents', Math.round((parseFloat(e.target.value) || 0) * 100))}
                        className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2.5 py-1.5 text-sm text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-ck-text-muted">{t('vat')}</label>
                      <select
                        value={line.tax_code}
                        onChange={e => updateLine(line.tempId, 'tax_code', e.target.value)}
                        className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2.5 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
                      >
                        <option value="H21">21%</option>
                        <option value="L9">9%</option>
                        <option value="N0">0%</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-3">
                      <select
                        value={line.kind}
                        onChange={e => updateLine(line.tempId, 'kind', e.target.value)}
                        className="rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1 text-[11px] text-ck-text-muted focus:border-ck-red focus:outline-none"
                      >
                        {KINDS.map(k => (
                          <option key={k} value={k}>{t(`kind_${k}`)}</option>
                        ))}
                      </select>
                      {line.discount_pct > 0 && (
                        <span className="text-[11px] text-red-400">-{line.discount_pct}%</span>
                      )}
                    </div>
                    <span className="font-mono text-sm tabular-nums text-ck-text-2">
                      {formatCents(calcLineTotal(line) + calcLineVat(line))}
                    </span>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="mt-4 border-t border-ck-border pt-3">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-ck-text-muted">{t('subtotal')}</span>
                      <span className="font-mono tabular-nums text-ck-text-2">{formatCents(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ck-text-muted">{t('vat')}</span>
                      <span className="font-mono tabular-nums text-ck-text-2">{formatCents(vatTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t border-ck-border pt-2 text-sm font-medium">
                      <span className="text-ck-text">{t('total')}</span>
                      <span className="font-mono tabular-nums text-ck-text">{formatCents(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice settings */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('invoiceSettings')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('language')}</label>
            <div className="flex gap-1">
              {(['nl', 'en', 'tr'] as const).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setInvoiceLocale(lang)}
                  className={`flex-1 rounded-[10px] border-[0.5px] px-3 py-2 text-sm font-mono uppercase transition-colors ${
                    invoiceLocale === lang
                      ? 'border-ck-red bg-ck-red/10 text-ck-red font-medium'
                      : 'border-ck-border text-ck-text-3 hover:border-ck-text-muted'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('notes')}</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              placeholder={invoiceType === 'deposit' ? t('depositNotesPlaceholder') : t('notesPlaceholder')}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('paymentTerms')}</label>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={2}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              placeholder={invoiceType === 'deposit'
                ? t('depositTermsPlaceholder')
                : t('paymentTermsPlaceholder')
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
