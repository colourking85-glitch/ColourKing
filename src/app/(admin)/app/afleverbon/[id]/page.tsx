'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Send, Hash, Calendar,
  User, Pen, Printer, CheckSquare, Square,
  Share2, Copy, Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import SignatureCanvas from '@/components/SignatureCanvas';
import type { DocStatus } from '@/types/database';

type Signature = {
  id: string;
  signer_name: string;
  signer_role: string;
  signature_data: string;
  created_at: string;
};

type HandoverDetail = {
  id: string;
  doc_type: 'handover_note';
  doc_number: string | null;
  status: DocStatus;
  job_id: string | null;
  customer_id: string;
  vehicle_id: string | null;
  locale: string;
  gallery_consent: boolean | null;
  payload: {
    work_summary: string;
    mileage_out: number;
    warranty_text: string;
    gallery_consent: boolean;
    items_returned: string[];
  } | null;
  signed_at: string | null;
  signed_by_name: string | null;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  staff: { id: string; name: string } | null;
  signatures: Signature[];
};

const STATUS_KEYS: Record<DocStatus, string> = {
  draft: 'draft',
  issued: 'issued',
  cancelled: 'cancelled',
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  issued: 'text-emerald-400 bg-emerald-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HandoverNotePage() {
  const t = useTranslations('ho');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<HandoverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/handover-notes/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setDoc)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleIssue = async () => {
    if (!doc?.payload) return;
    setActing(true);
    const res = await fetch(`/api/handover-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'issue', payload: doc.payload }),
    });
    if (res.ok) load();
    setActing(false);
  };

  const handleGalleryConsent = async (consent: boolean) => {
    setActing(true);
    const res = await fetch(`/api/handover-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gallery_consent', consent }),
    });
    if (res.ok) load();
    setActing(false);
  };

  const handleShare = async () => {
    setActing(true);
    const res = await fetch(`/api/handover-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share' }),
    });
    if (res.ok) {
      const data = await res.json();
      const link = `${window.location.origin}/s/handover/${data.share_token}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setActing(false);
  };

  const handlePrint = () => {
    window.open(`/app/afleverbon/${id}/print`, '_blank');
  };

  const handleSign = async (signatureData: string) => {
    if (!signerName.trim()) return;
    setActing(true);
    const res = await fetch(`/api/handover-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sign',
        signer_name: signerName,
        signer_role: 'customer',
        signature_data: signatureData,
      }),
    });
    if (res.ok) {
      setShowSign(false);
      setSignerName('');
      load();
    }
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!doc || !doc.payload) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-ck-text-faint" />
        <p className="text-sm text-ck-text-muted">{t('notFound')}</p>
        <Link href="/app/documenten" className="text-sm text-ck-red hover:underline">
          {t('backToDocuments')}
        </Link>
      </div>
    );
  }

  const p = doc.payload;
  const isDraft = doc.status === 'draft';
  const hasSig = doc.signatures && doc.signatures.length > 0;

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
                {doc.doc_number ?? tc('draft').toUpperCase()}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[doc.status]}`}>
                {t(STATUS_KEYS[doc.status])}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('title')}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleIssue}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {t('issued')}
            </button>
          )}
          {!isDraft && (
            <button
              onClick={handleShare}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? t('copied') : t('share')}
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={!doc.payload}
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
          >
            <Printer size={14} />
            {t('pdf')}
          </button>
        </div>
      </div>

      {/* Share link display */}
      {shareLink && (
        <div className="flex items-center gap-2 rounded-[10px] border-[0.5px] border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <Share2 size={14} className="shrink-0 text-emerald-400" />
          <input
            type="text"
            readOnly
            value={shareLink}
            className="flex-1 bg-transparent text-xs font-mono text-ck-text-2 outline-none"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Work summary */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('workSummary')}</h2>
            <p className="text-sm text-ck-text-2 whitespace-pre-wrap">{p.work_summary}</p>
          </div>

          {/* Mileage out */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('mileageOutLabel')}</h2>
            <p className="font-mono text-sm tabular-nums text-ck-text-2">
              {p.mileage_out > 0 ? `${p.mileage_out.toLocaleString('nl-NL')} km` : t('notFilledIn')}
            </p>
          </div>

          {/* Warranty */}
          {p.warranty_text && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('warranty')}</h2>
              <p className="text-sm text-ck-text-2 whitespace-pre-wrap">{p.warranty_text}</p>
            </div>
          )}

          {/* Items returned */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('returnedItems')}</h2>
            {p.items_returned.length > 0 ? (
              <ul className="space-y-2">
                {p.items_returned.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-ck-text-2">
                    <CheckSquare size={14} className="text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ck-text-muted italic">{t('noItems')}</p>
            )}
          </div>

          {/* Gallery consent */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('galleryConsent')}</h2>
            <button
              onClick={() => isDraft && handleGalleryConsent(!doc.gallery_consent)}
              disabled={acting || !isDraft}
              className="flex items-center gap-2 text-sm text-ck-text-2 transition-colors disabled:opacity-50"
            >
              {doc.gallery_consent ? (
                <CheckSquare size={16} className="text-emerald-400" />
              ) : (
                <Square size={16} className="text-ck-text-muted" />
              )}
              {t('galleryConsentDesc')}
            </button>
          </div>

          {/* Signature section */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('signature')}</h2>

            {hasSig ? (
              <div className="space-y-4">
                {doc.signatures.map(sig => (
                  <div key={sig.id} className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ck-text">{sig.signer_name}</p>
                        <p className="text-[11px] text-ck-text-muted">{sig.signer_role === 'customer' ? t('roleCustomer') : t('roleStaff')}</p>
                      </div>
                      <p className="text-[11px] text-ck-text-muted">{fmtDate(sig.created_at)}</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sig.signature_data}
                      alt={`${t('signature')} ${sig.signer_name}`}
                      className="h-20 rounded-lg border-[0.5px] border-ck-border bg-ck-surface-3 object-contain"
                    />
                  </div>
                ))}
              </div>
            ) : showSign ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] text-ck-text-muted">{t('signerName')}</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder={t('signerPlaceholder')}
                    className="w-full max-w-xs rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                  />
                </div>
                <SignatureCanvas onSign={handleSign} disabled={acting || !signerName.trim()} />
                <button
                  onClick={() => { setShowSign(false); setSignerName(''); }}
                  className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
                >
                  {tc('cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSign(true)}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
              >
                <Pen size={14} />
                {t('signHere')}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('details')}</h2>
            <div className="space-y-2">
              <InfoRow icon={Hash} label={t('docNumber')} value={doc.doc_number ?? t('notIssued')} mono />
              <InfoRow icon={Calendar} label={t('details')} value={fmtDate(doc.created_at)} />
              {doc.issued_at && <InfoRow icon={Calendar} label={t('issued')} value={fmtDate(doc.issued_at)} />}
              {doc.signed_at && <InfoRow icon={Pen} label={t('signature')} value={fmtDate(doc.signed_at)} />}
              {doc.signed_by_name && <InfoRow icon={User} label={t('signature')} value={doc.signed_by_name} />}
              {doc.customers && <InfoRow icon={User} label={tc('customer')} value={doc.customers.name} />}
              {doc.job_id && (
                <div className="pt-2">
                  <Link
                    href={`/app/jobs/${doc.job_id}`}
                    className="text-sm text-ck-red hover:underline"
                  >
                    {t('goToJob')}
                  </Link>
                </div>
              )}
            </div>
          </div>
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
