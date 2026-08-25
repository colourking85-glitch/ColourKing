'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search, ShoppingCart, Plus, CheckCircle, Clock,
  DollarSign, Receipt,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';
import type { PurchaseCategory } from '@/types/database';

type PurchaseRow = {
  id: string;
  purchase_number: string | null;
  supplier_name: string;
  supplier_vat_number: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  tax_code: string;
  category: PurchaseCategory;
  description: string | null;
  reference: string | null;
  paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  created_at: string;
};

const CATEGORIES: PurchaseCategory[] = [
  'general', 'parts', 'paint', 'materials', 'tools',
  'rent', 'utilities', 'insurance', 'other',
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'text-ck-text-muted bg-ck-surface-3',
  parts: 'text-blue-400 bg-blue-400/10',
  paint: 'text-purple-400 bg-purple-400/10',
  materials: 'text-orange-400 bg-orange-400/10',
  tools: 'text-cyan-400 bg-cyan-400/10',
  rent: 'text-amber-400 bg-amber-400/10',
  utilities: 'text-lime-400 bg-lime-400/10',
  insurance: 'text-emerald-400 bg-emerald-400/10',
  other: 'text-ck-text-muted bg-ck-surface-3',
};

export default function PurchaseListPage() {
  const t = useTranslations('pu');
  const tc = useTranslations('common');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);

  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (paidFilter) params.set('paid', paidFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    fetch(`/api/purchases?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPurchases)
      .finally(() => setLoading(false));
  }, [search, categoryFilter, paidFilter, dateFrom, dateTo]);

  // Summary calculations
  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const thisMonth = purchases.filter(p => p.invoice_date >= monthStart);
    const unpaid = purchases.filter(p => !p.paid);
    const vatDeductible = purchases.reduce((sum, p) => sum + p.vat_cents, 0);

    return {
      monthTotal: thisMonth.reduce((sum, p) => sum + p.total_cents, 0),
      unpaidTotal: unpaid.reduce((sum, p) => sum + p.total_cents, 0),
      vatDeductible,
    };
  }, [purchases]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-ck-text">{t('title')}</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            {t('subtitle')}
          </p>
        </div>
        <Link
          href="/app/inkoop/nieuw"
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          {t('new')}
        </Link>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <div className="flex items-center gap-2 text-ck-text-muted">
            <DollarSign size={14} />
            <span className="text-[11px] uppercase tracking-wider">{t('summaryMonth')}</span>
          </div>
          <p className="mt-1 font-mono text-lg tabular-nums text-ck-text">{formatCents(summary.monthTotal)}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <div className="flex items-center gap-2 text-ck-text-muted">
            <Clock size={14} />
            <span className="text-[11px] uppercase tracking-wider">{t('summaryUnpaid')}</span>
          </div>
          <p className="mt-1 font-mono text-lg tabular-nums text-ck-text">{formatCents(summary.unpaidTotal)}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <div className="flex items-center gap-2 text-ck-text-muted">
            <Receipt size={14} />
            <span className="text-[11px] uppercase tracking-wider">{t('summaryVat')}</span>
          </div>
          <p className="mt-1 font-mono text-lg tabular-nums text-ck-text">{formatCents(summary.vatDeductible)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface py-2 pl-10 pr-4 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">{t('allCategories')}</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{t(`cat_${c}`)}</option>
          ))}
        </select>
        <select
          value={paidFilter}
          onChange={e => setPaidFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">{tc('all')}</option>
          <option value="paid">{t('paid')}</option>
          <option value="unpaid">{t('unpaid')}</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          placeholder={t('dateFrom')}
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          placeholder={t('dateTo')}
        />
      </div>

      {/* Table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <ShoppingCart size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || categoryFilter || paidFilter ? t('noPurchasesFound') : t('noPurchases')}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 font-medium">{t('date')}</th>
                <th className="px-4 py-3 font-medium">{t('supplier')}</th>
                <th className="px-4 py-3 font-medium">{t('reference')}</th>
                <th className="px-4 py-3 font-medium">{t('category')}</th>
                <th className="px-4 py-3 font-medium">{t('description')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('total')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('vat')}</th>
                <th className="px-4 py-3 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-ck-text-muted">
                    {new Date(p.invoice_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-text">{p.supplier_name}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-ck-text-muted">{p.reference ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.other}`}>
                      {t(`cat_${p.category}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-text-2 max-w-[200px] truncate">{p.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ck-text-2">
                    {formatCents(p.total_cents)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-ck-text-muted">
                    {formatCents(p.vat_cents)}
                  </td>
                  <td className="px-4 py-3">
                    {p.paid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                        <CheckCircle size={12} />
                        {t('paid')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-medium">
                        <Clock size={12} />
                        {t('unpaid')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
