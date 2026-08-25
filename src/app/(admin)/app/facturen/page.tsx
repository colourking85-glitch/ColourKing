'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, FileText, Plus, Send, CheckCircle, AlertCircle,
  File, Clock, Ban, CreditCard,
} from 'lucide-react';
import type { InvoiceStatus } from '@/types/database';

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  subtotal_cents: number;
  total_cents: number;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  sent_at: string | null;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  paid: 'Betaald',
  overdue: 'Achterstallig',
  cancelled: 'Geannuleerd',
  credited: 'Gecrediteerd',
};

const STATUS_ICONS: Record<InvoiceStatus, typeof File> = {
  draft: File,
  sent: Send,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: Ban,
  credited: CreditCard,
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  sent: 'text-blue-400 bg-blue-400/10',
  paid: 'text-emerald-400 bg-emerald-400/10',
  overdue: 'text-red-400 bg-red-400/10',
  cancelled: 'text-ck-text-muted bg-ck-surface-3',
  credited: 'text-orange-400 bg-orange-400/10',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-ck-text">Facturen</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            Alle facturen en creditnota&apos;s
          </p>
        </div>
        <Link
          href="/app/facturen/nieuw"
          className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          Nieuwe factuur
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder="Zoek op factuurnr. of klantnaam..."
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
          {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Invoices table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || statusFilter ? 'Geen facturen gevonden' : 'Nog geen facturen'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 font-medium">Factuur</th>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Vervaldatum</th>
                <th className="px-4 py-3 font-medium text-right">Totaal</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const Icon = STATUS_ICONS[inv.status];
                const isOverdue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/facturen/${inv.id}`} className="flex items-center gap-2 hover:text-ck-red transition-colors">
                        <Icon size={14} className="text-ck-text-muted" />
                        <span className="font-mono text-sm tabular-nums text-ck-text">
                          {inv.invoice_number ?? 'CONCEPT'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-text-2">{inv.customers?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-ck-text-muted">
                      {new Date(inv.sent_at ?? inv.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {inv.due_date ? (
                        <span className={`font-mono text-xs tabular-nums ${isOverdue ? 'text-red-400' : 'text-ck-text-muted'}`}>
                          {new Date(inv.due_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ck-text-2">
                      {formatCents(inv.total_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
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
