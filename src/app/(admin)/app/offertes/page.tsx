'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, Plus, Send, CheckCircle, XCircle, File, GitBranch } from 'lucide-react';
import type { OfferType, OfferStatus } from '@/types/database';

type OfferRow = {
  id: string;
  type: OfferType;
  status: OfferStatus;
  offer_number: string | null;
  origin: string;
  subtotal_cents: number;
  total_cents: number;
  valid_until: string | null;
  created_at: string;
  sent_at: string | null;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
};

const TYPE_LABELS: Record<OfferType, string> = {
  offer: 'Offerte',
  supplement: 'Aanvulling',
};

const TYPE_COLORS: Record<OfferType, string> = {
  offer: 'text-emerald-400 bg-emerald-400/10',
  supplement: 'text-blue-400 bg-blue-400/10',
};

const STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
  superseded: 'Vervangen',
};

const STATUS_ICONS: Record<OfferStatus, typeof File> = {
  draft: File,
  sent: Send,
  approved: CheckCircle,
  rejected: XCircle,
  superseded: GitBranch,
};

const STATUS_COLORS: Record<OfferStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  sent: 'text-blue-400 bg-blue-400/10',
  approved: 'text-emerald-400 bg-emerald-400/10',
  rejected: 'text-red-400 bg-red-400/10',
  superseded: 'text-amber-400 bg-amber-400/10',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function OfferListPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/offers?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setOffers)
      .finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-ck-text">Offertes</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            Alle offertes en aanvullingen
          </p>
        </div>
        <Link
          href="/app/offertes/nieuw"
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          Nieuwe offerte
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder="Zoek op offertenr. of klantnaam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface py-2 pl-10 pr-4 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">Alle types</option>
          {(Object.keys(TYPE_LABELS) as OfferType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">Alle statussen</option>
          {(Object.keys(STATUS_LABELS) as OfferStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Offers table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || typeFilter || statusFilter ? 'Geen offertes gevonden' : 'Nog geen offertes'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 font-medium">Offerte</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium">Voertuig</th>
                <th className="px-4 py-3 font-medium">Totaal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Datum</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => {
                const Icon = STATUS_ICONS[offer.status];
                return (
                  <tr key={offer.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/offertes/${offer.id}`} className="flex items-center gap-2 hover:text-ck-red transition-colors">
                        <Icon size={14} className="text-ck-text-muted" />
                        <span className="font-mono text-sm tabular-nums text-ck-text">
                          {offer.offer_number ?? 'CONCEPT'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[offer.type]}`}>
                        {TYPE_LABELS[offer.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-text-2">{offer.customers?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {offer.vehicles ? (
                        <span className="text-sm text-ck-text-3">
                          {offer.vehicles.kenteken ?? offer.vehicles.make}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums text-ck-text-2">
                      {formatCents(offer.total_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[offer.status]}`}>
                        {STATUS_LABELS[offer.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-ck-text-muted">
                      {new Date(offer.sent_at ?? offer.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
