'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Vehicle = {
  id: string;
  kenteken: string | null;
  make: string | null;
  model: string | null;
  colour: string | null;
  year: number | null;
  wok: boolean;
  status: string | null;
  customers: { id: string; name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-900/30 text-blue-400',
  in_progress: 'bg-amber-900/30 text-amber-400',
  done: 'bg-green-900/30 text-green-400',
  archived: 'bg-gray-700/30 text-gray-400',
};

type SortField = 'kenteken' | 'make' | 'colour' | 'year' | 'created_at';
type SortDir = 'asc' | 'desc';

export default function VehiclesPage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('sort', sortField);
    params.set('dir', sortDir);
    fetch(`/api/vehicles?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, [search, statusFilter, sortField, sortDir]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  const statuses = ['created', 'in_progress', 'done', 'archived'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="VH05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <Link
          href="/app/voertuigen/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              !statusFilter
                ? 'bg-ck-red text-white'
                : 'border border-ck-dark-border text-ck-muted hover:text-white'
            }`}
          >
            {tCommon('all')}
          </button>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-ck-red text-white'
                  : 'border border-ck-dark-border text-ck-muted hover:text-white'
              }`}
            >
              {t(`status_${s}`)}
            </button>
          ))}
        </div>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="flex items-center gap-1 text-xs text-ck-muted hover:text-white"
          >
            <X size={12} /> {t('clearFilters')}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">
            {search || statusFilter ? t('noVehiclesFound') : t('noVehiclesMessage')}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort('kenteken')} className="flex items-center gap-1 hover:text-white">
                    {t('kenteken')} <SortIcon field="kenteken" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort('make')} className="flex items-center gap-1 hover:text-white">
                    {tCommon('vehicle')} <SortIcon field="make" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort('colour')} className="flex items-center gap-1 hover:text-white">
                    {t('colour')} <SortIcon field="colour" />
                  </button>
                </th>
                <th className="px-4 py-3">{t('owner')}</th>
                <th className="px-4 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                  <td className="px-4 py-3">
                    <Link href={`/app/voertuigen/${v.id}`} className="font-mono text-sm font-medium text-white hover:text-ck-red">
                      {v.kenteken ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">
                    {[v.make, v.model, v.year].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">{v.colour ?? '—'}</td>
                  <td className="px-4 py-3">
                    {v.customers ? (
                      <Link href={`/app/klanten/${v.customers.id}`} className="text-sm text-ck-muted-light hover:text-white">
                        {v.customers.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-ck-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {v.status && (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                          {t(`status_${v.status}`)}
                        </span>
                      )}
                      {v.wok && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle size={12} /> WOK
                        </span>
                      )}
                    </div>
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
