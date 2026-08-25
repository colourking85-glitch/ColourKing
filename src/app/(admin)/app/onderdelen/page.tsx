'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Package, AlertTriangle, Plus } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { PartStatus } from '@/types/database';

type PartRow = {
  id: string;
  job_id: string;
  description: string;
  part_number: string | null;
  supplier: string | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  status: PartStatus;
  blocking: boolean;
  created_at: string;
  jobs: { id: string; job_number: string | null } | null;
};

const STATUS_LABELS: Record<PartStatus, string> = {
  needed: 'Nodig',
  ordered: 'Besteld',
  shipped: 'Verzonden',
  received: 'Ontvangen',
  returned: 'Geretourneerd',
};

const STATUS_COLORS: Record<PartStatus, string> = {
  needed: 'text-amber-400 bg-amber-400/10',
  ordered: 'text-blue-400 bg-blue-400/10',
  shipped: 'text-purple-400 bg-purple-400/10',
  received: 'text-emerald-400 bg-emerald-400/10',
  returned: 'text-red-400 bg-red-400/10',
};

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function PartsListPage() {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [blockingFilter, setBlockingFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (blockingFilter) params.set('blocking', blockingFilter);
    fetch(`/api/parts?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setParts)
      .finally(() => setLoading(false));
  }, [search, statusFilter, blockingFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="PT05" />
          <div>
            <h1 className="text-base font-medium text-ck-text">Onderdelen</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              Alle onderdelen en hun status
            </p>
          </div>
        </div>
        <Link
          href="/app/onderdelen/nieuw"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          Nieuw onderdeel
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder="Zoek op omschrijving, artikelnr. of leverancier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface py-2 pl-10 pr-4 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">Alle statussen</option>
          {(Object.keys(STATUS_LABELS) as PartStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={blockingFilter}
          onChange={e => setBlockingFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">Alle</option>
          <option value="true">Blokkerend</option>
          <option value="false">Niet-blokkerend</option>
        </select>
      </div>

      {/* Parts table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : parts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <Package size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || statusFilter || blockingFilter ? 'Geen onderdelen gevonden' : 'Nog geen onderdelen'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 font-medium">Artikelnr.</th>
                <th className="px-4 py-3 font-medium">Omschrijving</th>
                <th className="px-4 py-3 font-medium">Leverancier</th>
                <th className="px-4 py-3 font-medium">Opdracht</th>
                <th className="px-4 py-3 font-medium text-right">Aantal</th>
                <th className="px-4 py-3 font-medium text-right">Prijs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Blok.</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm tabular-nums text-ck-text">
                      {part.part_number ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-text-2">{part.description}</td>
                  <td className="px-4 py-3 text-sm text-ck-text-3">{part.supplier ?? '-'}</td>
                  <td className="px-4 py-3">
                    {part.jobs ? (
                      <Link
                        href={`/app/opdrachten/${part.job_id}`}
                        className="text-sm text-ck-text-3 hover:text-ck-red transition-colors"
                      >
                        {part.jobs.job_number ?? part.job_id.slice(0, 8)}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ck-text">
                    {part.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ck-text">
                    {formatEuros(part.total_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[part.status]}`}>
                      {STATUS_LABELS[part.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {part.blocking && (
                      <AlertTriangle size={14} className="inline text-amber-400" />
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
