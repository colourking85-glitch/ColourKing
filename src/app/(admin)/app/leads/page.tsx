'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Clock, MessageCircle, FileText, Trophy, XCircle, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, SlidersHorizontal, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Lead = {
  id: string;
  number: number | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  kenteken: string | null;
  damage_description: string | null;
  status: string;
  origin: string;
  channel: string | null;
  appointment_type: string | null;
  created_at: string;
};

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
const ORIGINS = ['website', 'Offerte-Web', 'phone', 'email', 'walk_in', 'referral'] as const;

type SortField = 'created_at' | 'contact_name' | 'status' | 'origin';
type SortDir = 'asc' | 'desc';

export default function LeadsPage() {
  const t = useTranslations('ld');
  const tCommon = useTranslations('common');

  const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string; icon: typeof Clock }> = {
    new: { label: t('new_status'), color: 'text-blue-400 bg-blue-400/10', dotColor: 'bg-blue-400', icon: Clock },
    contacted: { label: t('contacted'), color: 'text-amber-400 bg-amber-400/10', dotColor: 'bg-amber-400', icon: MessageCircle },
    quoted: { label: t('quoted'), color: 'text-purple-400 bg-purple-400/10', dotColor: 'bg-purple-400', icon: FileText },
    won: { label: t('won'), color: 'text-green-400 bg-green-400/10', dotColor: 'bg-green-400', icon: Trophy },
    lost: { label: t('lost'), color: 'text-red-400 bg-red-400/10', dotColor: 'bg-red-400', icon: XCircle },
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (originFilter) params.set('origin', originFilter);
    params.set('sort', sortBy);
    params.set('dir', sortDir);
    fetch(`/api/leads?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setLeads)
      .finally(() => setLoading(false));
  }, [search, statusFilter, originFilter, sortBy, sortDir]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir(field === 'contact_name' ? 'asc' : 'desc');
    }
  }

  async function changeStatus(leadId: string, newStatus: string) {
    setUpdatingId(leadId);
    const body: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'lost') {
      const reason = prompt(t('lostReasonPrompt'));
      if (reason === null) { setUpdatingId(null); return; }
      body.lost_reason = reason;
    }
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: updated.status } : l));
    }
    setUpdatingId(null);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-ck-muted/40" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-ck-red" />
      : <ArrowDown size={12} className="text-ck-red" />;
  }

  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="LD05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
          {!loading && (
            <span className="rounded-full bg-ck-dark-border px-2.5 py-0.5 text-xs text-ck-muted">
              {leads.length}
            </span>
          )}
        </div>
        <Link
          href="/app/leads/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      {/* Search + toolbar */}
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          onClick={fetchLeads}
          className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white hover:border-ck-muted/50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('refresh')}
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            showFilters || originFilter
              ? 'border-ck-red/30 bg-ck-red/10 text-ck-red'
              : 'border-ck-dark-border text-ck-muted-light hover:text-white hover:border-ck-muted/50'
          }`}
        >
          <SlidersHorizontal size={14} />
          {t('filters')}
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <FilterBtn
          label={`${tCommon('all')} (${leads.length})`}
          active={!statusFilter}
          onClick={() => setStatusFilter('')}
        />
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] ?? 0;
          return (
            <FilterBtn
              key={s}
              label={`${cfg.label} (${count})`}
              active={statusFilter === s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              dotColor={cfg.dotColor}
            />
          );
        })}
      </div>

      {/* Origin filter (collapsible) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ck-dark-border bg-ck-dark-card p-3">
          <span className="text-xs text-ck-muted">{t('source')}:</span>
          <FilterBtn label={tCommon('all')} active={!originFilter} onClick={() => setOriginFilter('')} />
          {ORIGINS.map(o => (
            <FilterBtn key={o} label={t(o)} active={originFilter === o} onClick={() => setOriginFilter(originFilter === o ? '' : o)} />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-ck-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border bg-ck-dark-surface">
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort('contact_name')} className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ck-muted hover:text-white">
                  {t('name')} <SortIcon field="contact_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase text-ck-muted">{t('contact')}</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase text-ck-muted">{t('kenteken')}</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ck-muted hover:text-white">
                  {t('status')} <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort('origin')} className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ck-muted hover:text-white">
                  {t('source')} <SortIcon field="origin" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ck-muted hover:text-white ml-auto">
                  {tCommon('date')} <SortIcon field="created_at" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-ck-muted">{tCommon('loading')}</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-ck-muted">
                {search || statusFilter || originFilter ? t('noLeadsFound') : t('noLeadsMessage')}
              </td></tr>
            ) : (
              leads.map(lead => {
                const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-ck-dark-border/50 bg-ck-dark-card hover:bg-ck-dark-surface/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.number && (
                          <span className="rounded bg-ck-dark-surface px-1.5 py-0.5 font-mono text-[10px] text-ck-muted">
                            LD-{String(lead.number).padStart(4, '0')}
                          </span>
                        )}
                        <Link href={`/app/leads/${lead.id}`} className="font-medium text-white hover:text-ck-red">
                          {lead.contact_name}
                        </Link>
                        {lead.channel === 'appointment_form' && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-400" title={t('appointmentRequest')}>
                            <Calendar size={10} />
                            {t(`type_${lead.appointment_type ?? 'inspection'}`)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ck-muted">
                      <div className="max-w-[200px] truncate">
                        {lead.contact_email && <span>{lead.contact_email}</span>}
                        {lead.contact_email && lead.contact_phone && <span> · </span>}
                        {lead.contact_phone && <span>{lead.contact_phone}</span>}
                        {!lead.contact_email && !lead.contact_phone && <span className="italic">{t('noContactInfo')}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.kenteken ? (
                        <span className="rounded bg-ck-dark-surface px-2 py-0.5 font-mono text-xs uppercase text-ck-muted-light">
                          {lead.kenteken}
                        </span>
                      ) : (
                        <span className="text-xs text-ck-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={e => changeStatus(lead.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${cfg.color} cursor-pointer focus:outline-none focus:ring-1 focus:ring-ck-red disabled:opacity-50`}
                        onClick={e => e.stopPropagation()}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-ck-muted-light">
                      {lead.origin ? t(lead.origin as 'website') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ck-muted">
                      {new Date(lead.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick, dotColor }: { label: string; active: boolean; onClick: () => void; dotColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-ck-red/15 text-ck-red ring-1 ring-ck-red/30'
          : 'bg-ck-dark-card text-ck-muted hover:text-white hover:bg-ck-dark-surface'
      }`}
    >
      {dotColor && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {label}
    </button>
  );
}
