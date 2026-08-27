'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, User, Building2, Truck, Store, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
  created_at: string;
};

type SortKey = 'type' | 'name' | 'email' | 'phone' | 'city' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 hover:bg-green-900/50',
  inactive: 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50',
  blocked: 'bg-red-900/30 text-red-400 hover:bg-red-900/50',
};

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  inactive: 1,
  blocked: 2,
};

const TYPE_ICONS: Record<string, typeof User> = {
  private: User,
  company: Building2,
  fleet: Truck,
  dealer: Store,
};

const TYPE_ORDER: Record<string, number> = {
  company: 0,
  dealer: 1,
  fleet: 2,
  private: 3,
};

export default function CustomersPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/customers?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [search]);

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
        const va = (a[sortKey] ?? '').toString().toLowerCase();
        const vb = (b[sortKey] ?? '').toString().toLowerCase();
        cmp = va.localeCompare(vb);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [customers, sortKey, sortDir]);

  const toggleStatus = useCallback(async (customer: Customer) => {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    setTogglingId(customer.id);
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setCustomers(prev => prev.map(c =>
        c.id === customer.id ? { ...c, status: newStatus } : c
      ));
    }
    setTogglingId(null);
  }, []);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronsUpDown size={12} className="text-ck-muted/50" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-ck-red" />
      : <ChevronDown size={12} className="text-ck-red" />;
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'type', label: t('type') },
    { key: 'name', label: t('name') },
    { key: 'email', label: t('email') },
    { key: 'phone', label: t('phone') },
    { key: 'city', label: t('city') },
    { key: 'status', label: t('status') },
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

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
        />
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
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const Icon = TYPE_ICONS[c.type] ?? User;
                return (
                  <tr key={c.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs text-ck-muted">
                        <Icon size={14} />
                        {t(c.type as 'private' | 'company' | 'fleet' | 'dealer')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/app/klanten/${c.id}`} className="font-medium text-white hover:text-ck-red">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(c)}
                        disabled={togglingId === c.id}
                        className={`cursor-pointer rounded-full px-2 py-0.5 text-xs transition-colors ${STATUS_COLORS[c.status] ?? ''} ${togglingId === c.id ? 'opacity-50' : ''}`}
                        title={c.status === 'active' ? t('status_inactive') : t('status_active')}
                      >
                        {togglingId === c.id ? '...' : t(`status_${c.status}` as 'status_active' | 'status_inactive' | 'status_blocked')}
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
