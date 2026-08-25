'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download, FileText, ShoppingCart, Calculator,
  TrendingUp, ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { periodToDateRange, type PeriodType } from '@/modules/bookkeeping/schema';
import type { ProfitLossData, ProfitLossCategory } from '@/modules/bookkeeping/queries';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

type ExportCard = {
  type: 'invoices' | 'purchases' | 'vat' | 'profit_loss';
  icon: React.ElementType;
  color: string;
};

const EXPORT_CARDS: ExportCard[] = [
  { type: 'invoices', icon: FileText, color: 'text-emerald-400' },
  { type: 'purchases', icon: ShoppingCart, color: 'text-pink-400' },
  { type: 'vat', icon: Calculator, color: 'text-lime-400' },
  { type: 'profit_loss', icon: TrendingUp, color: 'text-cyan-400' },
];

export default function BookkeepingPage() {
  const t = useTranslations('bk');
  const tc = useTranslations('common');
  const { locale } = useAppLocale();
  const formatCents = useCallback((c: number) => formatCurrency(c, locale), [locale]);

  // Period state
  const [periodType, setPeriodType] = useState<PeriodType>('quarter');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [period, setPeriod] = useState(() => {
    const m = new Date().getMonth() + 1;
    return Math.ceil(m / 3);
  });

  // Data state
  const [summary, setSummary] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Compute date range from period
  const dateRange = useMemo(() => {
    return periodToDateRange({
      periodType,
      year,
      period: periodType === 'year' ? undefined : period,
    });
  }, [periodType, year, period]);

  // Fetch summary
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    fetch(`/api/bookkeeping/summary?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [dateRange]);

  // Download handler
  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      const body: Record<string, unknown> = {
        type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      if (type === 'vat') {
        body.year = year;
      }

      const res = await fetch('/api/bookkeeping/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloading(null);
    }
  };

  // Period label
  const periodLabel = useMemo(() => {
    if (periodType === 'year') return String(year);
    if (periodType === 'quarter') return `Q${period} ${year}`;
    return `${String(period).padStart(2, '0')}/${year}`;
  }, [periodType, year, period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-[500] text-white">{t('title')}</h1>
            <ScreenBadge code="BK10" />
          </div>
          <p className="text-sm text-[#6b6b80] mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-[#12121a] border-[0.5px] border-[#1e1e2a] rounded-[10px] p-4">
        <h2 className="text-sm font-[500] text-white mb-3">{t('periodSelector')}</h2>
        <div className="flex flex-wrap gap-3">
          {/* Period type */}
          <div className="relative">
            <select
              value={periodType}
              onChange={(e) => {
                const pt = e.target.value as PeriodType;
                setPeriodType(pt);
                if (pt === 'quarter') setPeriod(Math.ceil((new Date().getMonth() + 1) / 3));
                if (pt === 'month') setPeriod(new Date().getMonth() + 1);
              }}
              className="appearance-none bg-[#0a0a0f] border-[0.5px] border-[#1e1e2a] rounded-[10px] px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#E8364E]"
            >
              <option value="month">{t('month')}</option>
              <option value="quarter">{t('quarter')}</option>
              <option value="year">{t('year')}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] pointer-events-none" />
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-[#0a0a0f] border-[0.5px] border-[#1e1e2a] rounded-[10px] px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#E8364E]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] pointer-events-none" />
          </div>

          {/* Period (month or quarter) */}
          {periodType !== 'year' && (
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="appearance-none bg-[#0a0a0f] border-[0.5px] border-[#1e1e2a] rounded-[10px] px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#E8364E]"
              >
                {periodType === 'quarter'
                  ? QUARTERS.map((q) => (
                      <option key={q} value={q}>Q{q}</option>
                    ))
                  : MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {t(`monthName.m${m}`)}
                      </option>
                    ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] pointer-events-none" />
            </div>
          )}

          <span className="self-center text-sm text-[#6b6b80]">
            {dateRange.startDate} — {dateRange.endDate}
          </span>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_CARDS.map(({ type, icon: Icon, color }) => (
          <div
            key={type}
            className="bg-[#12121a] border-[0.5px] border-[#1e1e2a] rounded-[10px] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <h3 className="text-sm font-[500] text-white">{t(`export.${type}`)}</h3>
              </div>
              <button
                onClick={() => handleDownload(type)}
                disabled={downloading === type}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-[500] rounded-[10px] bg-[#E8364E]/10 text-[#E8364E] hover:bg-[#E8364E]/20 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading === type ? tc('loading') : t('download')}
              </button>
            </div>
            <p className="text-xs text-[#6b6b80]">
              {t(`exportDesc.${type}`)}
            </p>
            <p className="text-xs text-[#6b6b80] mt-1">
              {t('period')}: {periodLabel}
            </p>
          </div>
        ))}
      </div>

      {/* Profit/Loss summary */}
      <div className="bg-[#12121a] border-[0.5px] border-[#1e1e2a] rounded-[10px] p-4">
        <h2 className="text-sm font-[500] text-white mb-4">{t('profitLoss')}</h2>

        {loading ? (
          <p className="text-sm text-[#6b6b80]">{tc('loading')}</p>
        ) : !summary ? (
          <p className="text-sm text-[#6b6b80]">{t('noData')}</p>
        ) : (
          <div className="space-y-4">
            {/* Revenue */}
            <div className="flex items-center justify-between py-2 border-b border-[#1e1e2a]">
              <span className="text-sm text-white">{t('revenue')}</span>
              <span className="text-sm text-emerald-400 font-[500]">
                {formatCents(summary.revenue.total_cents)}
              </span>
            </div>

            {/* Costs by category */}
            {summary.costs.byCategory.map((cat: ProfitLossCategory) => (
              <div
                key={cat.category}
                className="flex items-center justify-between py-1 pl-4"
              >
                <span className="text-sm text-[#6b6b80]">
                  {t(`category.${cat.category}`)}
                </span>
                <span className="text-sm text-[#6b6b80]">
                  -{formatCents(cat.subtotal_cents)}
                </span>
              </div>
            ))}

            {/* Cost total */}
            <div className="flex items-center justify-between py-2 border-b border-[#1e1e2a]">
              <span className="text-sm text-white">{t('totalCosts')}</span>
              <span className="text-sm text-red-400 font-[500]">
                -{formatCents(summary.costs.total_cents)}
              </span>
            </div>

            {/* Net profit */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-[500] text-white">{t('netProfit')}</span>
              <span
                className={`text-sm font-[500] ${
                  summary.profit_cents >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCents(summary.profit_cents)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
