'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calculator, FileCheck, FileEdit, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle, Clock, RefreshCw,
} from 'lucide-react';
import type { VatReturnStatus, VatPeriodType } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';

type VatReturnRow = {
  id: string;
  period_type: VatPeriodType;
  year: number;
  period: number;
  status: VatReturnStatus;
  box1a_supplies_high: number;
  box1b_supplies_low: number;
  box1c_supplies_other: number;
  box1d_private_use: number;
  box1e_supplies_zero: number;
  box2a_supplies_from_eu: number;
  box4a_vat_on_supplies: number;
  box4b_vat_on_eu: number;
  box5a_vat_deductible: number;
  box5b_vat_balance: number;
  box5c_small_business: number;
  box5d_estimate_previous: number;
  box5e_total_payable: number;
  box5f_total_refund: number;
  filed_at: string | null;
  locked: boolean;
  filer: { id: string; name: string } | null;
};

const STATUS_COLORS: Record<VatReturnStatus, string> = {
  open: 'text-ck-text-muted bg-ck-surface-3',
  draft: 'text-blue-400 bg-blue-400/10',
  filed: 'text-emerald-400 bg-emerald-400/10',
  corrected: 'text-orange-400 bg-orange-400/10',
};

const STATUS_ICONS: Record<VatReturnStatus, typeof Clock> = {
  open: Clock,
  draft: FileEdit,
  filed: CheckCircle,
  corrected: AlertCircle,
};

export default function VatDashboardPage() {
  const t = useTranslations('bw');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [periodType, setPeriodType] = useState<VatPeriodType>('quarter');
  const [returns, setReturns] = useState<VatReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<number | null>(null);
  const [filing, setFiling] = useState<string | null>(null);

  const fetchReturns = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(year) });
    fetch(`/api/vat?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReturns)
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const periods = periodType === 'quarter'
    ? [1, 2, 3, 4]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const periodLabel = (p: number) => {
    if (periodType === 'quarter') return t(`quarter.q${p}`);
    return t(`month.m${p}`);
  };

  const statusLabel = (s: VatReturnStatus) => t(`status.${s}`);

  // Summary calculations
  const totalPayableYtd = returns
    .filter(r => r.status === 'filed' || r.status === 'draft')
    .reduce((sum, r) => sum + r.box5e_total_payable, 0);
  const totalRefundYtd = returns
    .filter(r => r.status === 'filed' || r.status === 'draft')
    .reduce((sum, r) => sum + r.box5f_total_refund, 0);
  const filedCount = returns.filter(r => r.status === 'filed').length;
  const outstandingCount = periods.length - filedCount;

  const getReturnForPeriod = (p: number) =>
    returns.find(r => r.period === p && r.period_type === periodType);

  const handleCalculate = async (period: number) => {
    setCalculating(period);
    try {
      const calcRes = await fetch('/api/vat/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, period, period_type: periodType }),
      });
      if (!calcRes.ok) throw new Error('Calculate failed');
      const calculated = await calcRes.json();

      // Create or update the draft
      const saveRes = await fetch('/api/vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...calculated, status: 'draft' }),
      });
      if (!saveRes.ok) throw new Error('Save failed');
      fetchReturns();
    } catch {
      // Error handling
    } finally {
      setCalculating(null);
    }
  };

  const handleFile = async (id: string) => {
    if (!window.confirm(t('confirmFile'))) return;
    setFiling(id);
    try {
      const res = await fetch(`/api/vat/${id}/file`, { method: 'POST' });
      if (!res.ok) throw new Error('File failed');
      fetchReturns();
    } catch {
      // Error handling
    } finally {
      setFiling(null);
    }
  };

  const handleCorrect = async (id: string) => {
    if (!window.confirm(t('confirmCorrect'))) return;
    try {
      const res = await fetch(`/api/vat/${id}/correct`, { method: 'POST' });
      if (!res.ok) throw new Error('Correct failed');
      fetchReturns();
    } catch {
      // Error handling
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-ck-text">{t('title')}</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('subtitle')}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <p className="text-[11px] text-ck-text-muted">{t('summary.payableYtd')}</p>
          <p className="mt-1 text-lg font-medium text-ck-text">{formatCents(totalPayableYtd)}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <p className="text-[11px] text-ck-text-muted">{t('summary.refundYtd')}</p>
          <p className="mt-1 text-lg font-medium text-ck-text">{formatCents(totalRefundYtd)}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <p className="text-[11px] text-ck-text-muted">{t('summary.filed')}</p>
          <p className="mt-1 text-lg font-medium text-ck-text">{filedCount}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <p className="text-[11px] text-ck-text-muted">{t('summary.outstanding')}</p>
          <p className="mt-1 text-lg font-medium text-ck-text">{outstandingCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="flex rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
          <button
            onClick={() => setPeriodType('quarter')}
            className={`px-3 py-1.5 text-sm ${
              periodType === 'quarter'
                ? 'bg-ck-accent text-white rounded-[10px]'
                : 'text-ck-text-muted'
            }`}
          >
            {t('periodQuarter')}
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`px-3 py-1.5 text-sm ${
              periodType === 'month'
                ? 'bg-ck-accent text-white rounded-[10px]'
                : 'text-ck-text-muted'
            }`}
          >
            {t('periodMonth')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ck-text-muted text-sm">{t('loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] text-ck-text-muted">
                <th className="px-4 py-2.5 font-normal"></th>
                <th className="px-4 py-2.5 font-normal">{t('columnPeriod')}</th>
                <th className="px-4 py-2.5 font-normal">{t('columnStatus')}</th>
                <th className="px-4 py-2.5 font-normal text-right">{t('columnPayable')}</th>
                <th className="px-4 py-2.5 font-normal text-right">{t('columnRefund')}</th>
                <th className="px-4 py-2.5 font-normal">{t('columnFiledAt')}</th>
                <th className="px-4 py-2.5 font-normal text-right">{t('columnActions')}</th>
              </tr>
            </thead>
            <tbody>
              {periods.flatMap(p => {
                const ret = getReturnForPeriod(p);
                const status: VatReturnStatus = ret?.status ?? 'open';
                const StatusIcon = STATUS_ICONS[status];
                const isExpanded = expandedId === ret?.id;

                const rows = [
                  <tr
                    key={`row-${p}`}
                    className="border-b border-ck-border hover:bg-ck-surface-2 cursor-pointer"
                    onClick={() => ret && setExpandedId(isExpanded ? null : ret.id)}
                  >
                    <td className="px-4 py-2.5 w-8">
                      {ret ? (
                        isExpanded ? <ChevronDown size={14} className="text-ck-text-muted" /> : <ChevronRight size={14} className="text-ck-text-muted" />
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-ck-text font-medium">
                      {periodLabel(p)} {year}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${STATUS_COLORS[status]}`}>
                        <StatusIcon size={12} />
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-ck-text tabular-nums">
                      {ret && ret.box5e_total_payable > 0 ? formatCents(ret.box5e_total_payable) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ck-text tabular-nums">
                      {ret && ret.box5f_total_refund > 0 ? formatCents(ret.box5f_total_refund) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-ck-text-muted text-[11px]">
                      {ret?.filed_at
                        ? new Date(ret.filed_at).toLocaleDateString(locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB')
                        : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {(!ret || status === 'open') && (
                          <button
                            onClick={() => handleCalculate(p)}
                            disabled={calculating === p}
                            className="inline-flex items-center gap-1 rounded-[10px] bg-ck-accent/10 px-2.5 py-1 text-[11px] text-ck-accent hover:bg-ck-accent/20 disabled:opacity-50"
                          >
                            {calculating === p ? <RefreshCw size={12} className="animate-spin" /> : <Calculator size={12} />}
                            {t('calculate')}
                          </button>
                        )}
                        {status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleCalculate(p)}
                              disabled={calculating === p}
                              className="inline-flex items-center gap-1 rounded-[10px] bg-ck-surface-3 px-2.5 py-1 text-[11px] text-ck-text-muted hover:bg-ck-surface-4"
                            >
                              <RefreshCw size={12} />
                              {t('recalculate')}
                            </button>
                            <button
                              onClick={() => ret && handleFile(ret.id)}
                              disabled={filing === ret?.id}
                              className="inline-flex items-center gap-1 rounded-[10px] bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <FileCheck size={12} />
                              {t('file')}
                            </button>
                          </>
                        )}
                        {status === 'filed' && (
                          <button
                            onClick={() => ret && handleCorrect(ret.id)}
                            className="inline-flex items-center gap-1 rounded-[10px] bg-orange-500/10 px-2.5 py-1 text-[11px] text-orange-400 hover:bg-orange-500/20"
                          >
                            <FileEdit size={12} />
                            {t('correct')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>,
                ];

                if (ret && isExpanded) {
                  rows.push(
                    <tr key={`detail-${p}`} className="bg-ck-surface-2">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-2xl text-[12px]">
                          <h3 className="col-span-2 text-[11px] font-medium text-ck-text-muted mb-1">
                            {t('boxDetails')}
                          </h3>

                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.1a')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box1a_supplies_high)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.1b')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box1b_supplies_low)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.1c')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box1c_supplies_other)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.1d')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box1d_private_use)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.1e')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box1e_supplies_zero)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.2a')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box2a_supplies_from_eu)}</span>
                          </div>

                          <div className="col-span-2 border-t border-ck-border my-1" />

                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.4a')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box4a_vat_on_supplies)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.4b')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box4b_vat_on_eu)}</span>
                          </div>

                          <div className="col-span-2 border-t border-ck-border my-1" />

                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.5a')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box5a_vat_deductible)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.5b')}</span>
                            <span className="text-ck-text tabular-nums font-medium">{formatCents(ret.box5b_vat_balance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.5c')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box5c_small_business)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted">{t('box.5d')}</span>
                            <span className="text-ck-text tabular-nums">{formatCents(ret.box5d_estimate_previous)}</span>
                          </div>

                          <div className="col-span-2 border-t border-ck-border my-1" />

                          <div className="flex justify-between">
                            <span className="text-ck-text-muted font-medium">{t('box.5e')}</span>
                            <span className="text-ck-text tabular-nums font-medium">{formatCents(ret.box5e_total_payable)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ck-text-muted font-medium">{t('box.5f')}</span>
                            <span className="text-ck-text tabular-nums font-medium">{formatCents(ret.box5f_total_refund)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
