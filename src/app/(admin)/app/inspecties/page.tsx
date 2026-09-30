'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ClipboardCheck, Eye, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { STATUS_LABELS, STATUS_COLORS, type InsStatus } from '@/modules/inspectie/machine';

const ALL_STATUSES: InsStatus[] = ['CONCEPT', 'BEZIG', 'TER_AKKOORD', 'AKKOORD', 'VERGRENDELD', 'GEANNULEERD'];

type Inspection = {
  id: string;
  reference: string;
  status: InsStatus;
  purpose: string | null;
  licence_plate: string | null;
  make: string | null;
  model: string | null;
  odometer_km: number | null;
  finding_count: number;
  photo_count: number;
  total_hours: number | null;
  indicative_total_cents: number | null;
  created_at: string;
  locked_at: string | null;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string; make: string; model: string } | null;
  staff: { id: string; name: string } | null;
};

type SortField = 'reference' | 'status' | 'vehicle' | 'customer' | 'finding_count' | 'total_hours' | 'indicative_total_cents' | 'date';
type SortDir = 'asc' | 'desc';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function formatHours(h: number | null) {
  if (!h) return '—';
  return h.toFixed(1).replace('.', ',') + ' u';
}

function formatCents(cents: number | null) {
  if (!cents) return '—';
  return '€ ' + Math.round(cents / 100).toLocaleString('nl-NL');
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (current !== field) return <ChevronsUpDown size={14} className="ml-1 inline opacity-30" />;
  return dir === 'asc'
    ? <ChevronUp size={14} className="ml-1 inline text-ck-red" />
    : <ChevronDown size={14} className="ml-1 inline text-ck-red" />;
}

function getSortValue(ins: Inspection, field: SortField): string | number {
  switch (field) {
    case 'reference': return ins.reference;
    case 'status': return ins.status;
    case 'vehicle': return `${ins.make || ''} ${ins.model || ''}`.trim();
    case 'customer': return ins.customers?.name || '';
    case 'finding_count': return ins.finding_count;
    case 'total_hours': return ins.total_hours ?? 0;
    case 'indicative_total_cents': return ins.indicative_total_cents ?? 0;
    case 'date': return new Date(ins.locked_at || ins.created_at).getTime();
    default: return '';
  }
}

export default function InspectiesPage() {
  const t = useTranslations('in');
  const tCommon = useTranslations('common');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/inspections?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setInspections)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'date' || field === 'finding_count' || field === 'total_hours' || field === 'indicative_total_cents' ? 'desc' : 'asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortField) return inspections;
    return [...inspections].sort((a, b) => {
      const va = getSortValue(a, sortField);
      const vb = getSortValue(b, sortField);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'nl');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [inspections, sortField, sortDir]);

  const thClass = 'px-4 py-3 cursor-pointer select-none hover:text-white transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ScreenBadge code="IN05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <Link
          href="/app/inspecties/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none"
        >
          <option value="">{t('allStatuses')}</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s].nl}</option>
          ))}
        </select>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('statuses.BEZIG'), count: inspections.filter(i => i.status === 'BEZIG').length, color: 'text-blue-400' },
          { label: t('statuses.TER_AKKOORD'), count: inspections.filter(i => i.status === 'TER_AKKOORD').length, color: 'text-amber-400' },
          { label: t('statuses.VERGRENDELD'), count: inspections.filter(i => i.status === 'VERGRENDELD').length, color: 'text-purple-400' },
          { label: tCommon('total'), count: inspections.length, color: 'text-white' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
            <div className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.count}</div>
            <div className="mt-1 text-xs text-ck-muted">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : inspections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <ClipboardCheck size={40} className="text-ck-muted/30" />
            <p className="text-ck-muted">
              {search || statusFilter ? t('noResults') : t('noInspections')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase tracking-wider text-ck-muted">
                <th className={thClass} onClick={() => toggleSort('reference')}>
                  {t('reference')}<SortIcon field="reference" current={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => toggleSort('status')}>
                  {t('status')}<SortIcon field="status" current={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => toggleSort('vehicle')}>
                  {t('vehicle')}<SortIcon field="vehicle" current={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => toggleSort('customer')}>
                  {t('customer')}<SortIcon field="customer" current={sortField} dir={sortDir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => toggleSort('finding_count')}>
                  {t('findings')}<SortIcon field="finding_count" current={sortField} dir={sortDir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => toggleSort('total_hours')}>
                  {t('hours')}<SortIcon field="total_hours" current={sortField} dir={sortDir} />
                </th>
                <th className={`${thClass} text-right`} onClick={() => toggleSort('indicative_total_cents')}>
                  {t('indicative')}<SortIcon field="indicative_total_cents" current={sortField} dir={sortDir} />
                </th>
                <th className={thClass} onClick={() => toggleSort('date')}>
                  {t('date')}<SortIcon field="date" current={sortField} dir={sortDir} />
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(ins => (
                <tr
                  key={ins.id}
                  className="border-b border-ck-dark-border last:border-0 hover:bg-ck-dark-surface transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/app/inspecties/${ins.id}`} className="font-mono text-sm font-medium text-white hover:text-ck-red">
                      {ins.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[ins.status]}`}>
                      {STATUS_LABELS[ins.status].nl}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">
                      {ins.make} {ins.model}
                    </div>
                    {ins.licence_plate && (
                      <span className="font-mono text-xs text-ck-muted">{ins.licence_plate}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">
                    {ins.customers?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ck-muted-light tabular-nums">
                    {ins.finding_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ck-muted-light tabular-nums">
                    {formatHours(ins.total_hours)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ck-muted-light tabular-nums">
                    {formatCents(ins.indicative_total_cents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted">
                    {formatDateTime(ins.locked_at || ins.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/inspecties/${ins.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ck-muted hover:bg-ck-dark-surface hover:text-white"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
