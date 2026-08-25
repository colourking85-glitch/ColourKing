'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';

const CATEGORIES = [
  'general', 'parts', 'paint', 'materials', 'tools',
  'rent', 'utilities', 'insurance', 'other',
] as const;

const TAX_CODES = ['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX'] as const;

const TAX_RATES: Record<string, number> = {
  H21: 21, L9: 9, N0: 0, V0: 0, M0: 0, ICP: 0, EX: 0,
};

export default function CreatePurchasePage() {
  const t = useTranslations('pu');
  const tc = useTranslations('common');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);
  const router = useRouter();

  const [supplierName, setSupplierName] = useState('');
  const [supplierVatNumber, setSupplierVatNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');
  const [subtotalEur, setSubtotalEur] = useState('');
  const [taxCode, setTaxCode] = useState<string>('H21');
  const [category, setCategory] = useState<string>('general');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [jobId, setJobId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subtotalCents = useMemo(() => {
    const parsed = parseFloat(subtotalEur);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }, [subtotalEur]);

  const vatCents = useMemo(() => {
    const rate = TAX_RATES[taxCode] ?? 0;
    return Math.round(subtotalCents * rate / 100);
  }, [subtotalCents, taxCode]);

  const totalCents = subtotalCents + vatCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceDate) return;

    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        supplier_name: supplierName.trim(),
        invoice_date: invoiceDate,
        subtotal_cents: subtotalCents,
        tax_code: taxCode,
        category,
      };

      if (supplierVatNumber.trim()) body.supplier_vat_number = supplierVatNumber.trim();
      if (dueDate) body.due_date = dueDate;
      if (description.trim()) body.description = description.trim();
      if (reference.trim()) body.reference = reference.trim();
      if (jobId.trim()) body.job_id = jobId.trim();

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || tc('saveFailed'));
      }

      router.push('/app/inkoop');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/inkoop" className="text-ck-text-muted hover:text-ck-text transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-base font-medium text-ck-text">{t('createTitle')}</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('createSubtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-6 space-y-4">
          {/* Supplier info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('supplier')} *
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                required
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                placeholder={t('supplierPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('supplierVat')}
              </label>
              <input
                type="text"
                value={supplierVatNumber}
                onChange={e => setSupplierVatNumber(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                placeholder="NL000000000B01"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('invoiceDate')} *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                required
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('dueDate')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
              />
            </div>
          </div>

          {/* Amount + Tax */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('subtotal')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={subtotalEur}
                onChange={e => setSubtotalEur(e.target.value)}
                required
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('taxCode')}
              </label>
              <select
                value={taxCode}
                onChange={e => setTaxCode(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
              >
                {TAX_CODES.map(c => (
                  <option key={c} value={c}>{c} ({TAX_RATES[c]}%)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('category')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{t(`cat_${c}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculated totals */}
          <div className="rounded-[10px] bg-ck-bg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ck-text-muted">{t('subtotal')}</span>
              <span className="font-mono tabular-nums text-ck-text">{formatCents(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ck-text-muted">{t('vat')} ({TAX_RATES[taxCode]}%)</span>
              <span className="font-mono tabular-nums text-ck-text">{formatCents(vatCents)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-ck-border pt-2">
              <span className="text-ck-text">{t('total')}</span>
              <span className="font-mono tabular-nums text-ck-text">{formatCents(totalCents)}</span>
            </div>
          </div>

          {/* Description + Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
                {t('reference')}
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                placeholder={t('referencePlaceholder')}
              />
            </div>
          </div>

          {/* Job link */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-ck-text-muted mb-1">
              {t('jobLink')}
            </label>
            <input
              type="text"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              placeholder={t('jobLinkPlaceholder')}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !supplierName.trim() || !invoiceDate || subtotalCents <= 0}
            className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-6 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {saving ? tc('saving') : tc('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
