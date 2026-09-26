'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, User, Building2, Truck, Store, Shield, Car, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Customer = {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  customer_no: string | null;
  legal_name: string | null;
  trade_name: string | null;
  tags: string[] | null;
  strategic_value: string | null;
  account_manager_id: string | null;
  customer_billing: Array<{ credit_hold: boolean }> | null;
  created_at: string;
};

type SortKey = 'type' | 'name' | 'email' | 'phone' | 'city' | 'status' | 'customer_no' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50',
  active: 'bg-green-900/30 text-green-400 hover:bg-green-900/50',
  suspended: 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50',
  blocked: 'bg-red-900/30 text-red-400 hover:bg-red-900/50',
  ended: 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50',
  inactive: 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50',
};

const STATUS_ORDER: Record<string, number> = {
  active: 0, prospect: 1, suspended: 2, blocked: 3, ended: 4, inactive: 5,
};

const TYPE_ICONS: Record<string, typeof User> = {
  private: User, sme: Building2, corporate_fleet: Truck, lease_company: Building2,
  rental: Car, taxi_transport: Truck, dealer: Store, bodyshop_partner: Store,
  insurer: Shield, insurance_intermediary: Shield, government: Building2,
  company: Building2, fleet: Truck,
};

const TYPE_ORDER: Record<string, number> = {
  sme: 0, corporate_fleet: 1, lease_company: 2, dealer: 3, insurer: 4,
  insurance_intermediary: 5, bodyshop_partner: 6, rental: 7, taxi_transport: 8,
  government: 9, private: 10, company: 0, fleet: 1,
};

const FILTER_STATUSES = ['all', 'prospect', 'active', 'suspended', 'blocked', 'ended'] as const;

export default function CustomersPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetch(`/api/customers?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  async function handleDelete(c: Customer) {
    if (!window.confirm(t('deleteConfirm'))) return;
    const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
    if (res.ok) setCustomers(prev => prev.filter(x => x.id !== c.id));
    else window.alert((await res.json().catch(() => ({}))).error ?? tCommon('saveFailed'));
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    const list = [...customers];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'status') {
        cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      } else if (sortKey === 'type') {
        cmp = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
      } else {
        const va = ((a as Record<string, unknown>)[sortKey] ?? '').toString().toLowerCase();
        const vb = ((b as Record<string, unknown>)[sortKey] ?? '').toString().toLowerCase();
        cmp = va.localeCompare(vb);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [customers, sortKey, sortDir]);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronsUpDown size={12} className="text-ck-muted/50" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-ck-red" />
      : <ChevronDown size={12} className="text-ck-red" />;
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'customer_no', label: t('customer_no') },
    { key: 'type', label: t('type') },
    { key: 'name', label: t('name') },
    { key: 'email', label: t('email') },
    { key: 'phone', label: t('phone') },
    { key: 'city', label: t('city') },
    { key: 'status', label: t('status') },
    { key: 'created_at', label: t('createdAt') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="KL05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <Link
          href="/app/klanten/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      <div className="flex gap-3">
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
        <div className="flex gap-1">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? (s === 'all' ? 'bg-ck-dark-surface text-white' : STATUS_COLORS[s] || 'bg-ck-dark-surface text-white')
                  : 'text-ck-muted hover:text-white'
              }`}
            >
              {s === 'all' ? tCommon('all') : t(`status_${s}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">
            {search ? t('noCustomersFound') : t('noCustomersMessage')}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none px-4 py-3 transition-colors hover:text-white"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon column={col.key} />
                    </span>
                  </th>
                ))}
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const Icon = TYPE_ICONS[c.type] ?? User;
                const hasCreditHold = c.customer_billing?.some(b => b.credit_hold);
                return (
                  <tr key={c.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                    <td className="px-4 py-3 text-xs text-ck-muted font-mono">{c.customer_no ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs text-ck-muted">
                        <Icon size={14} />
                        {t(c.type as Parameters<typeof t>[0]) || c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/app/klanten/${c.id}`} className="font-medium text-white hover:text-ck-red">
                        {c.name}
                      </Link>
                      {hasCreditHold && <AlertTriangle size={12} className="ml-1 inline text-red-400" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[c.status] ?? 'text-ck-muted'}`}>
                        {t(`status_${c.status}` as Parameters<typeof t>[0]) || c.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ck-muted-light tabular-nums" title={new Date(c.created_at).toLocaleString('nl-NL')}>
                      {new Date(c.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                      <span className="text-ck-muted">{new Date(c.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c)}
                        className="rounded-lg border border-transparent p-1.5 text-ck-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        title={tCommon('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
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
