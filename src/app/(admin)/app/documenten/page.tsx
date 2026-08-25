'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, FileCheck, FileMinus, File } from 'lucide-react';
import type { DocType, DocStatus } from '@/types/database';

type DocumentRow = {
  id: string;
  doc_type: DocType;
  doc_number: string | null;
  status: DocStatus;
  created_at: string;
  issued_at: string | null;
  cancelled_at: string | null;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  offer: 'Offerte',
  repair_order: 'Reparatieopdracht',
  handover_note: 'Afleverbon',
  invoice: 'Factuur',
  credit_note: 'Creditnota',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  offer: 'text-emerald-400 bg-emerald-400/10',
  repair_order: 'text-blue-400 bg-blue-400/10',
  handover_note: 'text-purple-400 bg-purple-400/10',
  invoice: 'text-amber-400 bg-amber-400/10',
  credit_note: 'text-red-400 bg-red-400/10',
};

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Concept',
  issued: 'Uitgegeven',
  cancelled: 'Geannuleerd',
};

const STATUS_ICONS: Record<DocStatus, typeof File> = {
  draft: File,
  issued: FileCheck,
  cancelled: FileMinus,
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  issued: 'text-emerald-400 bg-emerald-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

export default function DocumentArchivePage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
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
    fetch(`/api/documents?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-ck-text">Documentarchief</h1>
          <p className="mt-0.5 text-[11px] text-ck-text-muted">
            Alle documenten — offertes, facturen, reparatieopdrachten
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder="Zoek op documentnr. of klantnaam..."
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
          {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map(t => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-ck-red focus:outline-none"
        >
          <option value="">Alle statussen</option>
          {(Object.keys(STATUS_LABELS) as DocStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Documents table */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">
              {search || typeFilter || statusFilter ? 'Geen documenten gevonden' : 'Nog geen documenten'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-border text-left text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium">Voertuig</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Datum</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => {
                const Icon = STATUS_ICONS[doc.status];
                return (
                  <tr key={doc.id} className="border-b border-ck-divider last:border-0 hover:bg-ck-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/documenten/${doc.id}`} className="flex items-center gap-2 hover:text-ck-red transition-colors">
                        <Icon size={14} className="text-ck-text-muted" />
                        <span className="font-mono text-sm tabular-nums text-ck-text">
                          {doc.doc_number ?? 'CONCEPT'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${DOC_TYPE_COLORS[doc.doc_type]}`}>
                        {DOC_TYPE_LABELS[doc.doc_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-text-2">{doc.customers?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {doc.vehicles ? (
                        <span className="text-sm text-ck-text-3">
                          {doc.vehicles.kenteken ?? doc.vehicles.make}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[doc.status]}`}>
                        {STATUS_LABELS[doc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-ck-text-muted">
                      {new Date(doc.issued_at ?? doc.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
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
