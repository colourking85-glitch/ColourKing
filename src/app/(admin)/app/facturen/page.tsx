'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search, FileText, Plus, Send, CheckCircle, AlertCircle,
  File, Clock, Ban, CreditCard, ChevronUp, ChevronDown, ChevronsUpDown,
  Settings2, Eye, EyeOff,
} from 'lucide-react';
import type { InvoiceStatus } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  invoice_type: string | null;
  status: InvoiceStatus;
  locale: string | null;
  subtotal_cents: number;
  total_cents: number;
  vat_cents: number;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  issued_at: string | null;
  sent_at: string | null;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
};

type SortKey = 'invoice_number' | 'customer' | 'kenteken' | 'created_at' | 'issued_at' | 'due_date' | 'total_cents' | 'status' | 'locale' | 'invoice_type';
type SortDir = 'asc' | 'desc';

const STATUS_ICONS: Record<InvoiceStatus, typeof File> = {
  draft: File, sent: Send, paid: CheckCircle, overdue: AlertCircle, cancelled: Ban, credited: CreditCard,
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  sent: 'text-blue-400 bg-blue-400/10',
  paid: 'text-emerald-400 bg-emerald-400/10',
  overdue: 'text-red-400 bg-red-400/10',
  cancelled: 'text-ck-text-muted bg-ck-surface-3',
  credited: 'text-orange-400 bg-orange-400/10',
};

type ColumnDef = { key: SortKey; labelKey: string; defaultVisible: boolean; align?: 'right' };

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'invoice_number', labelKey: 'number', defaultVisible: true },
  { key: 'customer', labelKey: 'customer', defaultVisible: true },
  { key: 'kenteken', labelKey: 'plate', defaultVisible: true },
  { key: 'created_at', labelKey: 'createdDate', defaultVisible: true },
  { key: 'issued_at', labelKey: 'issuedDate', defaultVisible: false },
  { key: 'due_date', labelKey: 'dueDate', defaultVisible: true },
  { key: 'invoice_type', labelKey: 'invoiceTypeLabel', defaultVisible: false },
  { key: 'locale', labelKey: 'language', defaultVisible: false },
  { key: 'total_cents', labelKey: 'total', defaultVisible: true, align: 'right' },
  { key: 'status', labelKey: 'status', defaultVisible: true },
];

const STORAGE_KEY = 'ck_fa05_columns';

function loadVisibleColumns(): Set<SortKey> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored) as SortKey[]);
  } catch { /* ignore */ }
  return new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
}

export default function InvoiceListPage() {
  const t = useTranslations('fa');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);
  const tDoc = useTranslations('doc');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [visibleCols, setVisibleCols] = useState<Set<SortKey>>(loadVisibleColumns);
  const [showColPicker, setShowColPicker] = useState(false);

  const statusLabel = (s: InvoiceStatus): string => {
    const map: Record<InvoiceStatus, string> = { draft: t('draft'), sent: t('sent'), paid: t('paid'), overdue: t('overdue'), cancelled: t('cancelled'), credited: t('credited') };
    return map[s];
  };

  const allStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'credited'];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/invoices?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const toggleColumn = useCallback((key: SortKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const sorted = useMemo(() => {
    const list = [...invoices];
    const STATUS_ORDER: Record<string, number> = { draft: 0, sent: 1, overdue: 2, paid: 3, cancelled: 4, credited: 5 };
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'invoice_number': cmp = (a.invoice_number ?? '').localeCompare(b.invoice_number ?? ''); break;
        case 'customer': cmp = (a.customers?.name ?? '').localeCompare(b.customers?.name ?? ''); break;
        case 'kenteken': cmp = (a.vehicles?.kenteken ?? '').localeCompare(b.vehicles?.kenteken ?? ''); break;
        case 'created_at': cmp = a.created_at.localeCompare(b.created_at); break;
        case 'issued_at': cmp = (a.issued_at ?? '').localeCompare(b.issued_at ?? ''); break;
        case 'due_date': cmp = (a.due_date ?? '').localeCompare(b.due_date ?? ''); break;
        case 'total_cents': cmp = a.total_cents - b.total_cents; break;
        case 'status': cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9); break;
        case 'locale': cmp = (a.locale ?? '').localeCompare(b.locale ?? ''); break;
        case 'invoice_type': cmp = (a.invoice_type ?? '').localeCompare(b.invoice_type ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [invoices, sortKey, sortDir]);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronsUpDown size={10} className="text-ck-text-muted/40" />;
    return sortDir === 'asc' ? <ChevronUp size={10} className="text-ck-red" /> : <ChevronDown size={10} className="text-ck-red" />;
  }

  const activeCols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderCell(inv: InvoiceRow, col: ColumnDef) {
    const Icon = STATUS_ICONS[inv.status];
    const isOverdue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date();
    switch (col.key) {
      case 'invoice_number':
        return (
          <Link href={`/app/facturen/${inv.id}`} className="flex items-center gap-2 hover:text-ck-red transition-colors">
            <Icon size={14} className="text-ck-text-muted" />
            <span className="font-mono text-sm tabular-nums text-ck-text">
              {inv.invoice_number ?? t('draft')}
            </span>
          </Link>
        );
      case 'customer':
        return <span className="text-sm text-ck-text-2">{inv.customers?.name ?? '—'}</span>;
      case 'kenteken':
        return (
          <span className="font-mono text-xs tabular-nums text-ck-text-muted">
            {inv.vehicles?.kenteken ?? '—'}
          </span>
        );
      case 'created_at':
        return (
          <span className="whitespace-nowrap font-mono text-xs tabular-nums text-ck-text-muted" title={new Date(inv.created_at).toLocaleString('nl-NL')}>
            {fmtDate(inv.created_at)}{' '}
            <span className="text-ck-text-muted/60">{new Date(inv.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        );
      case 'issued_at':
        return <span className="font-mono text-xs tabular-nums text-ck-text-muted">{fmtDate(inv.issued_at ?? null)}</span>;
      case 'due_date':
        return inv.due_date ? (
          <span className={`font-mono text-xs tabular-nums ${isOverdue ? 'text-red-400 font-medium' : 'text-ck-text-muted'}`}>
            {fmtDate(inv.due_date)}
          </span>
        ) : <span className="text-ck-text-muted">—</span>;
      case 'invoice_type':
        return (
          <span className="text-xs text-ck-text-muted">
            {inv.invoice_type === 'deposit' ? t('depositInvoice') : t('standardInvoice')}
          </span>
        );
      case 'locale':
        return <span className="font-mono text-xs uppercase text-ck-text-muted">{inv.locale ?? 'nl'}</span>;
      case 'total_cents':
        return <span className="font-mono text-sm tabular-nums text-ck-text-2">{formatCents(inv.total_cents)}</span>;
      case 'status':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[inv.status]}`}>
            {statusLabel(inv.status)}
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="FA05" />
          <div>
            <h1 className="text-base font-medium text-ck-text">{t('title')}</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('subtitle')}</p>
          </div>
        </div>
        <Link
          href="/app/facturen/nieuw"
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          {t('new')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
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
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">{t('allStatuses')}</option>
          {allStatuses.map(s => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        {/* Column picker toggle */}
        <div className="relative">
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className={`rounded-[10px] border-[0.5px] border-ck-border p-2 text-ck-text-muted hover:text-ck-text hover:border-ck-red transition-colors ${showColPicker ? 'border-ck-red text-ck-red' : ''}`}
            title={t('configureColumns')}
          >
            <Settings2 size={16} />
          </button>
          {showColPicker && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface shadow-xl">
              <div className="p-2 text-[10px] uppercase tracking-wider text-ck-text-muted font-medium px-3 pt-3">
                {t('configureColumns')}
              </div>
              {ALL_COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-ck-surface-2 transition-colors"
                >
                  {visibleCols.has(col.key)
                    ? <Eye size={12} className="text-ck-red" />
                    : <EyeOff size={12} className="text-ck-text-muted/40" />
                  }
                  <span className={visibleCols.has(col.key) ? 'text-ck-text' : 'text-ck-text-muted'}>
                    {t(col.labelKey as Parameters<typeof t>[0])}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoices table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-x-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || statusFilter ? t('noInvoicesFound') : t('noInvoices')}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                {activeCols.map(col => (
                  <th
                    key={col.key}
                    className={`cursor-pointer select-none px-4 py-3 font-medium transition-colors hover:text-ck-text ${col.align === 'right' ? 'text-right' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {t(col.labelKey as Parameters<typeof t>[0])}
                      <SortIcon column={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(inv => (
                <tr key={inv.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                  {activeCols.map(col => (
                    <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {renderCell(inv, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
