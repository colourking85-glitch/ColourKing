'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Trash2, Save, Zap, UserCheck, X } from 'lucide-react';
import type { OfferLineKind, TaxCode, PayerType, LabourRate } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';

type CustomerOption = { id: string; name: string };
type VehicleOption = { id: string; kenteken: string | null; make: string | null; model: string | null; customer_id: string };

type LeadOption = {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  kenteken: string | null;
  damage_description: string | null;
  status: string;
  origin: string | null;
  locale: string | null;
  created_at: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
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
  part_number: string;
};

const KINDS: OfferLineKind[] = ['labour', 'part', 'material', 'other'];
const PAYER_TYPES: PayerType[] = ['casco', 'wa', 'particulier', 'lease'];

const TAX_RATES: Record<TaxCode, number> = {
  H21: 0.21,
  L9: 0.09,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

const SECTION_COLORS: Record<OfferLineKind, string> = {
  labour: 'border-l-blue-400',
  part: 'border-l-orange-400',
  material: 'border-l-purple-400',
  other: 'border-l-gray-400',
};

function emptyLine(kind: OfferLineKind = 'labour'): LineItem {
  return {
    tempId: crypto.randomUUID(),
    kind,
    description: '',
    quantity: 1,
    unit: kind === 'labour' ? 'uur' : 'st',
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

export default function CreateOfferPage() {
  const t = useTranslations('es');
  const tCommon = useTranslations('common');
  const tJb = useTranslations('jb');
  const { locale: appLocale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, appLocale);
  const tLd = useTranslations('ld');
  const tSy = useTranslations('sy');
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [rates, setRates] = useState<LabourRate[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [origin, setOrigin] = useState('manual');
  const [locale, setLocale] = useState('nl');
  const [validUntil, setValidUntil] = useState('');
  const [payerType, setPayerType] = useState<PayerType | ''>('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.ok ? r.json() : []).then(setCustomers);
    fetch('/api/vehicles').then(r => r.ok ? r.json() : []).then(setVehicles);
    fetch('/api/labour-rates').then(r => r.ok ? r.json() : []).then(setRates);
    Promise.all([
      fetch('/api/leads?status=new').then(r => r.ok ? r.json() : []),
      fetch('/api/leads?status=contacted').then(r => r.ok ? r.json() : []),
    ]).then(([newLeads, contactedLeads]) => setLeads([...newLeads, ...contactedLeads]));
  }, []);

  function selectLead(lead: LeadOption) {
    setLeadId(lead.id);
    if (lead.customers?.id) setCustomerId(lead.customers.id);
    if (lead.vehicles?.id) setVehicleId(lead.vehicles.id);
    else if (lead.kenteken) {
      const match = vehicles.find(v => v.kenteken?.toLowerCase() === lead.kenteken?.toLowerCase());
      if (match) {
        setVehicleId(match.id);
        if (!lead.customers?.id && match.customer_id) setCustomerId(match.customer_id);
      }
    }
    if (lead.damage_description) setNotes(lead.damage_description);
    if (lead.origin) setOrigin(lead.origin);
    if (lead.locale) setLocale(lead.locale);
  }

  function clearLead() {
    setLeadId(null);
    setCustomerId('');
    setVehicleId('');
    setNotes('');
    setOrigin('manual');
  }

  const filteredRates = useMemo(() => {
    if (!payerType) return rates;
    return rates.filter(r => !r.payer_type || r.payer_type === payerType);
  }, [rates, payerType]);

  const filteredVehicles = vehicles.filter(v => !customerId || v.customer_id === customerId);

  const linesByKind = useMemo(() => {
    const grouped: Record<OfferLineKind, LineItem[]> = { labour: [], part: [], material: [], other: [] };
    for (const l of lines) {
      grouped[l.kind].push(l);
    }
    return grouped;
  }, [lines]);

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

  function addFromRate(rate: LabourRate) {
    const newLine: LineItem = {
      tempId: crypto.randomUUID(),
      kind: rate.kind as OfferLineKind,
      description: rate.name,
      quantity: 1,
      unit: rate.unit,
      unit_price_cents: rate.unit_price_cents,
      discount_pct: 0,
      tax_code: rate.tax_code as TaxCode,
      part_number: '',
    };
    setLines(prev => [...prev, newLine]);
  }

  const handleSave = async () => {
    if (!customerId) { setError(t('selectCustomerPlaceholder')); return; }
    if (lines.length === 0 || lines.every(l => !l.description.trim())) {
      setError(t('addLine'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const offerRes = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          vehicle_id: vehicleId || null,
          lead_id: leadId || null,
          origin,
          locale,
          valid_until: validUntil || null,
          notes: notes || null,
          payer_type: payerType || null,
        }),
      });

      if (!offerRes.ok) throw new Error('Could not create offer');
      const offer = await offerRes.json();

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

  const inputClass = 'w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none';
  const lineInputClass = 'w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none';

  function renderLineRow(line: LineItem, idx: number) {
    return (
      <div key={line.tempId} className="grid grid-cols-12 items-end gap-2 py-2">
        <div className="col-span-3">
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('description')}</label>}
          <input
            type="text"
            value={line.description}
            onChange={e => updateLine(line.tempId, { description: e.target.value })}
            className={lineInputClass}
            placeholder={t('description')}
          />
        </div>
        <div>
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('quantity')}</label>}
          <input
            type="number"
            step="0.01"
            min="0"
            value={line.quantity}
            onChange={e => updateLine(line.tempId, { quantity: parseFloat(e.target.value) || 0 })}
            className={`${lineInputClass} tabular-nums`}
          />
        </div>
        <div>
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('unit')}</label>}
          <input
            type="text"
            value={line.unit}
            onChange={e => updateLine(line.tempId, { unit: e.target.value })}
            className={lineInputClass}
          />
        </div>
        <div className="col-span-2">
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('unitPrice')}</label>}
          <input
            type="number"
            step="0.01"
            min="0"
            value={(line.unit_price_cents / 100).toFixed(2)}
            onChange={e => updateLine(line.tempId, { unit_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
            className={`${lineInputClass} tabular-nums`}
          />
        </div>
        <div>
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('discount')} %</label>}
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={line.discount_pct}
            onChange={e => updateLine(line.tempId, { discount_pct: parseFloat(e.target.value) || 0 })}
            className={`${lineInputClass} tabular-nums`}
          />
        </div>
        <div>
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('taxCode')}</label>}
          <select
            value={line.tax_code}
            onChange={e => updateLine(line.tempId, { tax_code: e.target.value as TaxCode })}
            className={lineInputClass}
          >
            <option value="H21">21%</option>
            <option value="L9">9%</option>
            <option value="N0">0%</option>
          </select>
        </div>
        <div>
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('part')}</label>}
          <input
            type="text"
            value={line.part_number}
            onChange={e => updateLine(line.tempId, { part_number: e.target.value })}
            className={lineInputClass}
            placeholder="—"
          />
        </div>
        <div className="flex items-center justify-between">
          {idx === 0 && <label className="mb-1 block text-[10px] text-ck-text-muted">{t('total')}</label>}
          <span className="text-xs tabular-nums text-ck-text-2">{formatCents(calcLineTotalCents(line))}</span>
          <button onClick={() => removeLine(line.tempId)} className="ml-1 text-ck-text-muted hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  function sectionSubtotal(kind: OfferLineKind): number {
    return linesByKind[kind].reduce((sum, l) => sum + calcLineTotalCents(l), 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/offertes" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-medium text-ck-text">{t('new')}</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('createDraft')}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? tCommon('saving') : tCommon('save')}
        </button>
      </div>

      {error && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Lead selector */}
      {leads.length > 0 && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('recentLeads')}</h2>
          {leadId ? (
            <div className="flex items-center gap-2 rounded-lg border-[0.5px] border-green-500/30 bg-green-500/5 px-3 py-2">
              <UserCheck size={14} className="text-green-400" />
              <span className="text-sm text-ck-text">
                {leads.find(l => l.id === leadId)?.contact_name ?? t('fromLead')}
              </span>
              <span className="text-xs text-ck-text-muted">
                {leads.find(l => l.id === leadId)?.kenteken}
              </span>
              <button onClick={clearLead} className="ml-auto text-ck-text-muted hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leads.slice(0, 10).map(lead => (
                <button
                  key={lead.id}
                  onClick={() => selectLead(lead)}
                  className="flex flex-col items-start rounded-lg border-[0.5px] border-ck-border px-3 py-2 text-left transition-colors hover:border-ck-red"
                >
                  <span className="text-xs font-medium text-ck-text">{lead.contact_name}</span>
                  <span className="text-[10px] text-ck-text-muted">
                    {[lead.kenteken, lead.damage_description?.slice(0, 40)].filter(Boolean).join(' — ') || tLd('noContactInfo')}
                  </span>
                  <span className="mt-0.5 inline-block rounded bg-ck-bg px-1.5 py-0.5 text-[9px] text-ck-text-muted">
                    {lead.status === 'new' ? tLd('new_status') : tLd('contacted')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offer details */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('offerDetails')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('customer')} *</label>
            <select
              value={customerId}
              onChange={e => { setCustomerId(e.target.value); setVehicleId(''); }}
              className={inputClass}
            >
              <option value="">{t('selectCustomerPlaceholder')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('vehicle')}</label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('noVehiclePlaceholder')}</option>
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.kenteken ?? `${v.make ?? ''} ${v.model ?? ''}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{tJb('payerType')}</label>
            <select
              value={payerType}
              onChange={e => setPayerType(e.target.value as PayerType | '')}
              className={inputClass}
            >
              <option value="">—</option>
              {PAYER_TYPES.map(p => (
                <option key={p} value={p}>{tJb(`payer_${p}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('origin')}</label>
            <select
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className={inputClass}
            >
              <option value="manual">{t('manual')}</option>
              <option value="website">{tLd('website')}</option>
              <option value="phone">{tLd('phone')}</option>
              <option value="email">{tLd('email')}</option>
              <option value="walk_in">{tLd('walk_in')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('validUntil')}</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-ck-text-muted">{tSy('language')}</label>
            <select
              value={locale}
              onChange={e => setLocale(e.target.value)}
              className={inputClass}
            >
              <option value="nl">{tSy('languageNl')}</option>
              <option value="en">{tSy('languageEn')}</option>
              <option value="tr">{tSy('languageTr')}</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[11px] text-ck-text-muted">{t('notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className={`${inputClass} resize-y`}
              placeholder={t('notes')}
            />
          </div>
        </div>
      </div>

      {/* Rate templates */}
      {filteredRates.length > 0 && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('rateTemplates')}</h2>
          <div className="flex flex-wrap gap-2">
            {filteredRates.map(rate => (
              <button
                key={rate.id}
                onClick={() => addFromRate(rate)}
                className={`flex items-center gap-1.5 rounded-lg border-[0.5px] border-ck-border px-3 py-1.5 text-xs transition-colors hover:border-ck-red hover:text-ck-red ${SECTION_COLORS[rate.kind as OfferLineKind] ? 'border-l-2 ' + SECTION_COLORS[rate.kind as OfferLineKind] : ''}`}
              >
                <Zap size={10} className="text-ck-text-muted" />
                <span className="text-ck-text">{rate.name}</span>
                <span className="text-ck-text-muted">{formatCents(rate.unit_price_cents)}/{rate.unit}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Line items by section */}
      <div className="space-y-4">
        {KINDS.map(kind => {
          const sectionLines = linesByKind[kind];
          if (sectionLines.length === 0 && kind !== 'labour') return null;

          return (
            <div key={kind} className={`rounded-[10px] border-[0.5px] border-ck-border border-l-2 bg-ck-surface p-5 ${SECTION_COLORS[kind]}`}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t(kind)}</h2>
                <div className="flex items-center gap-3">
                  {sectionLines.length > 0 && (
                    <span className="text-xs tabular-nums text-ck-text-muted">{formatCents(sectionSubtotal(kind))}</span>
                  )}
                  <button
                    onClick={() => setLines(prev => [...prev, emptyLine(kind)])}
                    className="flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border px-2.5 py-1 text-[11px] text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
                  >
                    <Plus size={10} />
                    {t('addLine')}
                  </button>
                </div>
              </div>

              {sectionLines.length > 0 ? (
                <div className="divide-y divide-ck-border/50">
                  {sectionLines.map((line, idx) => renderLineRow(line, idx))}
                </div>
              ) : (
                <p className="py-3 text-center text-xs text-ck-text-muted">{t('noLines')}</p>
              )}
            </div>
          );
        })}

        {/* Add section buttons for empty kinds */}
        {KINDS.filter(k => linesByKind[k].length === 0 && k !== 'labour').length > 0 && (
          <div className="flex gap-2">
            {KINDS.filter(k => linesByKind[k].length === 0 && k !== 'labour').map(kind => (
              <button
                key={kind}
                onClick={() => setLines(prev => [...prev, emptyLine(kind)])}
                className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-dashed border-ck-border px-3 py-2 text-xs text-ck-text-muted hover:border-ck-red hover:text-ck-red transition-colors"
              >
                <Plus size={12} />
                {t(kind)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <div className="flex flex-col items-end gap-1">
          <div className="flex w-56 justify-between text-sm">
            <span className="text-ck-text-muted">{t('subtotal')}</span>
            <span className="font-mono tabular-nums text-ck-text-2">{formatCents(subtotalCents)}</span>
          </div>
          <div className="flex w-56 justify-between text-sm">
            <span className="text-ck-text-muted">{t('vat')}</span>
            <span className="font-mono tabular-nums text-ck-text-2">{formatCents(vatCents)}</span>
          </div>
          <div className="flex w-56 justify-between border-t border-ck-divider pt-1 text-sm font-medium">
            <span className="text-ck-text">{t('total')}</span>
            <span className="font-mono tabular-nums text-ck-text">{formatCents(totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
