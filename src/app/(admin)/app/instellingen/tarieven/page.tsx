'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { LabourRate, OfferLineKind, PayerType, TaxCode } from '@/types/database';

const KINDS: OfferLineKind[] = ['labour', 'part', 'material', 'other'];
const PAYER_TYPES: PayerType[] = ['casco', 'wa', 'particulier', 'lease'];
const TAX_CODES: TaxCode[] = ['H21', 'L9', 'N0'];

const KIND_COLORS: Record<string, string> = {
  labour: 'border-l-blue-400',
  part: 'border-l-orange-400',
  material: 'border-l-purple-400',
  other: 'border-l-gray-400',
};

export default function LabourRatesPage() {
  const t = useTranslations('sy');
  const tEs = useTranslations('es');
  const tJb = useTranslations('jb');
  const tCommon = useTranslations('common');
  const [rates, setRates] = useState<LabourRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRate, setNewRate] = useState({
    name: '',
    kind: 'labour' as OfferLineKind,
    payer_type: null as PayerType | null,
    description: '',
    unit: 'uur',
    unit_price_cents: 0,
    tax_code: 'H21' as TaxCode,
    is_default: false,
  });

  useEffect(() => {
    fetch('/api/labour-rates?active=false')
      .then(r => r.ok ? r.json() : [])
      .then(setRates)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id: string, updates: Partial<LabourRate>) {
    setSaving(id);
    const res = await fetch(`/api/labour-rates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setRates(prev => prev.map(r => r.id === id ? updated : r));
    }
    setSaving(null);
  }

  async function handleAdd() {
    if (!newRate.name.trim()) return;
    setAdding(true);
    const res = await fetch('/api/labour-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRate),
    });
    if (res.ok) {
      const created = await res.json();
      setRates(prev => [...prev, created]);
      setNewRate({ name: '', kind: 'labour', payer_type: null, description: '', unit: 'uur', unit_price_cents: 0, tax_code: 'H21', is_default: false });
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/labour-rates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRates(prev => prev.filter(r => r.id !== id));
    }
  }

  const inputClass = 'rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-sm text-white focus:border-ck-red focus:outline-none';
  const selectClass = inputClass;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY45" />
        <h1 className="font-display text-2xl font-bold text-white">{t('labourRates')}</h1>
      </div>
      <p className="text-sm text-ck-muted">{t('labourRatesDesc')}</p>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : (
          <div className="divide-y divide-ck-dark-border">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-ck-muted">
              <div className="col-span-2">{t('rateName')}</div>
              <div className="col-span-2">{tEs('type')}</div>
              <div className="col-span-2">{tJb('payerType')}</div>
              <div>{t('rateUnit')}</div>
              <div>{t('ratePrice')}</div>
              <div>{tEs('taxCode')}</div>
              <div>{t('rateDefault')}</div>
              <div>{t('rateActive')}</div>
              <div></div>
            </div>

            {/* Existing rates */}
            {rates.map(rate => (
              <div key={rate.id} className={`grid grid-cols-12 items-center gap-2 border-l-2 px-4 py-2 ${KIND_COLORS[rate.kind] ?? ''}`}>
                <div className="col-span-2">
                  <input
                    className={`${inputClass} w-full`}
                    value={rate.name}
                    onChange={e => setRates(prev => prev.map(r => r.id === rate.id ? { ...r, name: e.target.value } : r))}
                    onBlur={() => handleUpdate(rate.id, { name: rate.name })}
                  />
                </div>
                <div className="col-span-2">
                  <select
                    className={`${selectClass} w-full`}
                    value={rate.kind}
                    onChange={e => handleUpdate(rate.id, { kind: e.target.value as OfferLineKind })}
                  >
                    {KINDS.map(k => <option key={k} value={k}>{tEs(k)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <select
                    className={`${selectClass} w-full`}
                    value={rate.payer_type ?? ''}
                    onChange={e => handleUpdate(rate.id, { payer_type: (e.target.value || null) as PayerType | null })}
                  >
                    <option value="">{tCommon('all')}</option>
                    {PAYER_TYPES.map(p => <option key={p} value={p}>{tJb(`payer_${p}`)}</option>)}
                  </select>
                </div>
                <div>
                  <input
                    className={`${inputClass} w-full`}
                    value={rate.unit}
                    onChange={e => setRates(prev => prev.map(r => r.id === rate.id ? { ...r, unit: e.target.value } : r))}
                    onBlur={() => handleUpdate(rate.id, { unit: rate.unit })}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    className={`${inputClass} w-full tabular-nums`}
                    value={(rate.unit_price_cents / 100).toFixed(2)}
                    onChange={e => {
                      const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                      setRates(prev => prev.map(r => r.id === rate.id ? { ...r, unit_price_cents: cents } : r));
                    }}
                    onBlur={() => handleUpdate(rate.id, { unit_price_cents: rate.unit_price_cents })}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <select
                    className={`${selectClass} w-full`}
                    value={rate.tax_code}
                    onChange={e => handleUpdate(rate.id, { tax_code: e.target.value as TaxCode })}
                  >
                    {TAX_CODES.map(tc => <option key={tc} value={tc}>{tc === 'H21' ? '21%' : tc === 'L9' ? '9%' : '0%'}</option>)}
                  </select>
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={rate.is_default}
                    onChange={e => handleUpdate(rate.id, { is_default: e.target.checked })}
                    className="rounded border-ck-dark-border"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={rate.active}
                    onChange={e => handleUpdate(rate.id, { active: e.target.checked })}
                    className="rounded border-ck-dark-border"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleDelete(rate.id)}
                    className="text-ck-muted hover:text-red-400 transition-colors"
                    title={tCommon('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add new rate */}
            <div className="grid grid-cols-12 items-center gap-2 px-4 py-3 bg-ck-dark-surface/30">
              <div className="col-span-2">
                <input
                  className={`${inputClass} w-full`}
                  value={newRate.name}
                  onChange={e => setNewRate(n => ({ ...n, name: e.target.value }))}
                  placeholder={t('rateName')}
                />
              </div>
              <div className="col-span-2">
                <select
                  className={`${selectClass} w-full`}
                  value={newRate.kind}
                  onChange={e => setNewRate(n => ({ ...n, kind: e.target.value as OfferLineKind }))}
                >
                  {KINDS.map(k => <option key={k} value={k}>{tEs(k)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <select
                  className={`${selectClass} w-full`}
                  value={newRate.payer_type ?? ''}
                  onChange={e => setNewRate(n => ({ ...n, payer_type: (e.target.value || null) as PayerType | null }))}
                >
                  <option value="">{tCommon('all')}</option>
                  {PAYER_TYPES.map(p => <option key={p} value={p}>{tJb(`payer_${p}`)}</option>)}
                </select>
              </div>
              <div>
                <input
                  className={`${inputClass} w-full`}
                  value={newRate.unit}
                  onChange={e => setNewRate(n => ({ ...n, unit: e.target.value }))}
                />
              </div>
              <div>
                <input
                  type="number"
                  className={`${inputClass} w-full tabular-nums`}
                  value={(newRate.unit_price_cents / 100).toFixed(2)}
                  onChange={e => setNewRate(n => ({ ...n, unit_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <select
                  className={`${selectClass} w-full`}
                  value={newRate.tax_code}
                  onChange={e => setNewRate(n => ({ ...n, tax_code: e.target.value as TaxCode }))}
                >
                  {TAX_CODES.map(tc => <option key={tc} value={tc}>{tc === 'H21' ? '21%' : tc === 'L9' ? '9%' : '0%'}</option>)}
                </select>
              </div>
              <div className="col-span-2"></div>
              <div className="flex justify-center">
                <button
                  onClick={handleAdd}
                  disabled={adding || !newRate.name.trim()}
                  className="flex items-center gap-1 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
                >
                  <Plus size={12} />
                  {tCommon('add')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
