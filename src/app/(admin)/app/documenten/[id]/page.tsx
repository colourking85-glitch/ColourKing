'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, FileCheck, FileMinus, File,
  Send, Ban, Trash2, ExternalLink, Hash, Calendar,
  User, Car, Shield,
} from 'lucide-react';
import type { DocType, DocStatus } from '@/types/database';

type DocumentDetail = {
  id: string;
  doc_type: DocType;
  doc_number: string | null;
  status: DocStatus;
  supersedes_id: string | null;
  job_id: string | null;
  customer_id: string;
  vehicle_id: string | null;
  locale: string;
  payload: Record<string, unknown> | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  issued_at: string | null;
  issued_by: string | null;
  sent_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  staff: { id: string; name: string } | null;
  chain: Array<{
    id: string;
    doc_type: DocType;
    doc_number: string | null;
    status: DocStatus;
    created_at: string;
  }>;
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  offer: 'Offerte',
  repair_order: 'Reparatieopdracht',
  handover_note: 'Afleverbon',
  invoice: 'Factuur',
  credit_note: 'Creditnota',
};

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Concept',
  issued: 'Uitgegeven',
  cancelled: 'Geannuleerd',
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  issued: 'text-emerald-400 bg-emerald-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

const STATUS_ICONS: Record<DocStatus, typeof File> = {
  draft: File,
  issued: FileCheck,
  cancelled: FileMinus,
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/documents/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setDoc)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleIssue = async () => {
    if (!doc) return;
    setActing(true);
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'issue', payload: doc.payload ?? {} }),
    });
    if (res.ok) load();
    setActing(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setActing(true);
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', cancel_reason: cancelReason }),
    });
    if (res.ok) {
      setShowCancel(false);
      load();
    }
    setActing(false);
  };

  const handleDelete = async () => {
    setActing(true);
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/documenten');
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-ck-text-faint" />
        <p className="text-sm text-ck-text-muted">Document niet gevonden</p>
        <Link href="/app/documenten" className="text-sm text-ck-red hover:underline">
          Terug naar archief
        </Link>
      </div>
    );
  }

  const Icon = STATUS_ICONS[doc.status];
  const canIssue = doc.status === 'draft';
  const canCancel = doc.status === 'issued' && doc.doc_type !== 'invoice';
  const canDelete = doc.status === 'draft';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/documenten" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-lg font-medium tabular-nums text-ck-text">
                {doc.doc_number ?? 'CONCEPT'}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[doc.status]}`}>
                <Icon size={10} />
                {STATUS_LABELS[doc.status]}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              {DOC_TYPE_LABELS[doc.doc_type]}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canIssue && (
            <button
              onClick={handleIssue}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              Uitgeven
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] border border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Ban size={14} />
              Annuleren
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] border border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-muted hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      {showCancel && (
        <div className="rounded-[10px] border border-red-500/30 bg-ck-red-bg p-4">
          <p className="mb-3 text-sm font-medium text-ck-red-text">Document annuleren</p>
          <input
            type="text"
            placeholder="Reden voor annulering..."
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            className="mb-3 w-full rounded-lg border border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={acting || !cancelReason.trim()}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Bevestigen
            </button>
            <button
              onClick={() => { setShowCancel(false); setCancelReason(''); }}
              className="rounded-lg border border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
            >
              Terug
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details card */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Documentnummer" value={doc.doc_number ?? '—'} mono />
              <InfoRow icon={FileText} label="Type" value={DOC_TYPE_LABELS[doc.doc_type]} />
              <InfoRow icon={User} label="Klant" value={doc.customers?.name ?? '—'} />
              <InfoRow icon={Car} label="Voertuig" value={doc.vehicles ? (doc.vehicles.kenteken ?? `${doc.vehicles.make} ${doc.vehicles.model}`) : '—'} />
              <InfoRow icon={Calendar} label="Aangemaakt" value={fmtDate(doc.created_at)} />
              <InfoRow icon={Calendar} label="Uitgegeven" value={doc.issued_at ? fmtDate(doc.issued_at) : '—'} />
              {doc.staff && <InfoRow icon={User} label="Uitgegeven door" value={doc.staff.name} />}
              {doc.cancelled_at && (
                <>
                  <InfoRow icon={Ban} label="Geannuleerd" value={fmtDate(doc.cancelled_at)} />
                  <InfoRow icon={FileText} label="Reden" value={doc.cancel_reason ?? '—'} />
                </>
              )}
            </div>
          </div>

          {/* Integrity */}
          {doc.pdf_sha256 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Integriteit</h2>
              <div className="flex items-start gap-2">
                <Shield size={14} className="mt-0.5 text-emerald-400" />
                <div>
                  <p className="text-sm text-ck-text-2">SHA-256 hash</p>
                  <p className="mt-1 break-all font-mono text-xs text-ck-text-muted">{doc.pdf_sha256}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payload preview */}
          {doc.payload && Object.keys(doc.payload).length > 0 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Payload</h2>
              <pre className="overflow-x-auto rounded-lg bg-ck-bg p-3 font-mono text-xs text-ck-text-3">
                {JSON.stringify(doc.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Links */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Koppelingen</h2>
            <div className="space-y-2">
              {doc.customers && (
                <SideLink href={`/app/klanten/${doc.customers.id}`} label="Klant" value={doc.customers.name} />
              )}
              {doc.job_id && (
                <SideLink href={`/app/jobs/${doc.job_id}`} label="Opdracht" value={doc.job_id.slice(0, 8)} />
              )}
              {doc.supersedes_id && (
                <SideLink href={`/app/documenten/${doc.supersedes_id}`} label="Vervangt" value={doc.supersedes_id.slice(0, 8)} />
              )}
            </div>
          </div>

          {/* Document chain */}
          {doc.chain && doc.chain.length > 1 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Documentketen</h2>
              <div className="space-y-2">
                {doc.chain.map(c => (
                  <Link
                    key={c.id}
                    href={`/app/documenten/${c.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      c.id === doc.id ? 'bg-ck-surface-3 text-ck-text' : 'text-ck-text-3 hover:bg-ck-surface-2'
                    }`}
                  >
                    <span className="font-mono text-xs tabular-nums">{c.doc_number ?? 'CONCEPT'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: IconComp, label, value, mono }: { icon: typeof FileText; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <IconComp size={14} className="mt-0.5 text-ck-text-faint" />
      <div>
        <p className="text-[11px] text-ck-text-muted">{label}</p>
        <p className={`text-sm text-ck-text-2 ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function SideLink({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ck-text-3 hover:bg-ck-surface-2 transition-colors">
      <span className="text-[11px] text-ck-text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {value}
        <ExternalLink size={10} />
      </span>
    </Link>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
