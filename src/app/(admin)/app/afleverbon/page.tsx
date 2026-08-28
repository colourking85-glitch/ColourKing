'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search, FileText, CheckCircle, Clock, Ban, Send, Pen, Plus,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { DocStatus } from '@/types/database';

type HandoverRow = {
  id: string;
  doc_number: string | null;
  status: DocStatus;
  signed_at: string | null;
  issued_at: string | null;
  created_at: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
};

const STATUS_ICONS: Record<DocStatus, typeof FileText> = {
  draft: Pen,
  issued: Send,
  cancelled: Ban,
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: 'text-ck-muted bg-ck-surface-3',
  issued: 'text-blue-400 bg-blue-400/10',
  cancelled: 'text-red-400/60 bg-red-400/5',
};

export default function HandoverListPage() {
  const t = useTranslations('ho');
  const tDoc = useTranslations('doc');
  const [items, setItems] = useState<HandoverRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/handover-notes?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-medium text-ck-text">{t('titlePlural')}</h1>
            <ScreenBadge code="DO21" />
          </div>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('listSubtitle')}</p>
        </div>
        <Link
          href="/app/afleverbon/nieuw"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ck-red-hover"
        >
          <Plus size={14} />
          {t('create')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-panel pl-9 pr-3 py-2 text-sm text-ck-text placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ck-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border bg-ck-surface-2 text-left text-xs text-ck-muted">
              <th className="px-4 py-3 font-medium">{t('docNumber')}</th>
              <th className="px-4 py-3 font-medium">{tDoc('status')}</th>
              <th className="px-4 py-3 font-medium">{tDoc('customer')}</th>
              <th className="px-4 py-3 font-medium">{t('vehicle')}</th>
              <th className="px-4 py-3 font-medium">{tDoc('date')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-ck-dark-border border-t-ck-red" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ck-muted">
                  {t('noHandovers')}
                </td>
              </tr>
            ) : (
              items.map(item => {
                const isSigned = !!item.signed_at;
                const StatusIcon = isSigned ? CheckCircle : (STATUS_ICONS[item.status] || FileText);
                const color = isSigned ? 'text-emerald-400 bg-emerald-400/10' : (STATUS_COLORS[item.status] || '');
                const label = isSigned ? tDoc('signed') : tDoc(item.status);
                return (
                  <tr key={item.id} className="border-b border-ck-dark-border last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/afleverbon/${item.id}`} className="font-medium text-ck-red hover:underline">
                        {item.doc_number || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                        <StatusIcon size={12} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ck-text">
                      {item.customers?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-ck-muted">
                      {item.vehicles ? `${item.vehicles.kenteken || ''} ${item.vehicles.make || ''} ${item.vehicles.model || ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-ck-muted">
                      {new Date(item.created_at).toLocaleDateString('nl-NL')}
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
