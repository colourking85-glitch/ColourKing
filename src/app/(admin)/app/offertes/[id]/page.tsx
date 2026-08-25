'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft, FileText, Send, CheckCircle, XCircle,
  File, GitBranch, Trash2, Plus, Hash, Calendar,
  User, Car, ExternalLink, Copy,
} from 'lucide-react';
import type { OfferType, OfferStatus, OfferLineKind, TaxCode } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';

type OfferLine = {
  id: string;
  sort_order: number;
  kind: OfferLineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  discount_pct: number;
  line_total_cents: number;
  tax_code: TaxCode;
  vat_amount_cents: number;
  part_number: string | null;
  created_at: string;
};

type OfferDetail = {
  id: string;
  type: OfferType;
  status: OfferStatus;
  origin: string;
  offer_number: string | null;
  customer_id: string;
  vehicle_id: string | null;
  lead_id: string | null;
  job_id: string | null;
  parent_offer_id: string | null;
  supersedes_id: string | null;
  locale: string;
  valid_until: string | null;
  notes: string | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  approved_at: string | null;
  approved_by_name: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  staff: { id: string; name: string } | null;
  offer_lines: OfferLine[];
  chain: Array<{
    id: string;
    type: OfferType;
    offer_number: string | null;
    status: OfferStatus;
    created_at: string;
  }>;
};

const TYPE_KEYS: Record<OfferType, string> = {
  offer: 'offer',
  supplement: 'supplement',
};

const STATUS_KEYS: Record<OfferStatus, string> = {
  draft: 'draft',
  sent: 'sent',
  approved: 'approved',
  rejected: 'rejected',
  superseded: 'superseded',
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

const KIND_KEYS: Record<OfferLineKind, string> = {
  labour: 'labour',
  part: 'part',
  material: 'material',
  other: 'other',
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

export default function OfferDetailPage() {
  const t = useTranslations('es');
  const tCommon = useTranslations('common');
  const { locale } = useAppLocale();
  const formatCents = (c: number) => formatCurrency(c, locale);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveName, setApproveName] = useState('');

  // Add line state
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState({
    kind: 'labour' as OfferLineKind,
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price_cents: 0,
    discount_pct: 0,
    tax_code: 'H21' as TaxCode,
    part_number: '',
  });

  const load = () => {
    setLoading(true);
    fetch(`/api/offers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setOffer)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const doAction = async (body: Record<string, unknown>) => {
    setActing(true);
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      // If supersede, redirect to new offer
      if (body.action === 'supersede') {
        router.push(`/app/offertes/${data.id}`);
      } else {
        load();
      }
    }
    setActing(false);
  };

  const handleSend = () => doAction({ action: 'send' });
  const handleApprove = () => {
    if (!approveName.trim()) return;
    doAction({ action: 'approve', approved_by_name: approveName });
    setShowApprove(false);
  };
  const handleReject = () => {
    if (!rejectReason.trim()) return;
    doAction({ action: 'reject', rejected_reason: rejectReason });
    setShowReject(false);
  };
  const handleSupersede = () => doAction({ action: 'supersede' });

  const handleDelete = async () => {
    setActing(true);
    const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/offertes');
    setActing(false);
  };

  const handleAddLine = async () => {
    if (!newLine.description.trim()) return;
    setActing(true);
    const res = await fetch(`/api/offers/${id}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newLine,
        part_number: newLine.part_number || null,
        sort_order: (offer?.offer_lines?.length ?? 0),
      }),
    });
    if (res.ok) {
      setShowAddLine(false);
      setNewLine({ kind: 'labour', description: '', quantity: 1, unit: 'st', unit_price_cents: 0, discount_pct: 0, tax_code: 'H21', part_number: '' });
      load();
    }
    setActing(false);
  };

  const handleRemoveLine = async (lineId: string) => {
    setActing(true);
    const res = await fetch(`/api/offers/${id}/lines/${lineId}`, { method: 'DELETE' });
    if (res.ok) load();
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-ck-text-faint" />
        <p className="text-sm text-ck-text-muted">{tCommon('notFound')}</p>
        <Link href="/app/offertes" className="text-sm text-ck-red hover:underline">
          {t('backToOffers')}
        </Link>
      </div>
    );
  }

  const Icon = STATUS_ICONS[offer.status];
  const isDraft = offer.status === 'draft';
  const isSent = offer.status === 'sent';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/offertes" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-lg font-medium tabular-nums text-ck-text">
                {offer.offer_number ?? tCommon('draft').toUpperCase()}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[offer.status]}`}>
                <Icon size={10} />
                {t(STATUS_KEYS[offer.status])}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              {t(TYPE_KEYS[offer.type])} — {offer.origin}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleSend}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {t('send')}
            </button>
          )}
          {isSent && (
            <>
              <button
                onClick={() => setShowApprove(true)}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-[10px] bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={14} />
                {t('approve')}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                {t('reject')}
              </button>
              <button
                onClick={handleSupersede}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-amber-500/50 hover:text-amber-400 transition-colors disabled:opacity-50"
              >
                <Copy size={14} />
                {t('supersede')}
              </button>
            </>
          )}
          {isDraft && (
            <button
              onClick={handleDelete}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-muted hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Approve dialog */}
      {showApprove && (
        <div className="rounded-[10px] border-[0.5px] border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="mb-3 text-sm font-medium text-emerald-400">{t('approveOffer')}</p>
          <input
            type="text"
            placeholder={t('approvedBy')}
            value={approveName}
            onChange={e => setApproveName(e.target.value)}
            className="mb-3 w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={acting || !approveName.trim()}
              className="rounded-[10px] bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {tCommon('confirm')}
            </button>
            <button
              onClick={() => { setShowApprove(false); setApproveName(''); }}
              className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {showReject && (
        <div className="rounded-[10px] border-[0.5px] border-red-500/30 bg-red-500/5 p-4">
          <p className="mb-3 text-sm font-medium text-red-400">{t('rejectOffer')}</p>
          <input
            type="text"
            placeholder={t('rejectReason')}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="mb-3 w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-red-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={acting || !rejectReason.trim()}
              className="rounded-[10px] bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {tCommon('confirm')}
            </button>
            <button
              onClick={() => { setShowReject(false); setRejectReason(''); }}
              className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details card */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{tCommon('details')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Hash} label={t('number')} value={offer.offer_number ?? '—'} mono />
              <InfoRow icon={FileText} label={t('type')} value={t(TYPE_KEYS[offer.type])} />
              <InfoRow icon={User} label={t('customer')} value={offer.customers?.name ?? '—'} />
              <InfoRow icon={Car} label={t('vehicle')} value={offer.vehicles ? (offer.vehicles.kenteken ?? `${offer.vehicles.make} ${offer.vehicles.model}`) : '—'} />
              <InfoRow icon={Calendar} label={t('status')} value={fmtDate(offer.created_at)} />
              {offer.sent_at && <InfoRow icon={Send} label={t('sent')} value={fmtDate(offer.sent_at)} />}
              {offer.valid_until && <InfoRow icon={Calendar} label={t('validUntil')} value={new Date(offer.valid_until).toLocaleDateString('nl-NL')} />}
              {offer.staff && <InfoRow icon={User} label={t('origin')} value={offer.staff.name} />}
              {offer.approved_at && (
                <>
                  <InfoRow icon={CheckCircle} label={t('approved')} value={fmtDate(offer.approved_at)} />
                  <InfoRow icon={User} label={t('approvedBy')} value={offer.approved_by_name ?? '—'} />
                </>
              )}
              {offer.rejected_at && (
                <>
                  <InfoRow icon={XCircle} label={t('rejected')} value={fmtDate(offer.rejected_at)} />
                  <InfoRow icon={FileText} label={t('rejectReason')} value={offer.rejected_reason ?? '—'} />
                </>
              )}
              {offer.notes && <InfoRow icon={FileText} label={t('notes')} value={offer.notes} />}
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('lines')}</h2>
              {isDraft && (
                <button
                  onClick={() => setShowAddLine(true)}
                  className="flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border px-3 py-1.5 text-xs text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
                >
                  <Plus size={12} />
                  {tCommon('add')}
                </button>
              )}
            </div>

            {/* Add line form */}
            {showAddLine && (
              <div className="mb-4 rounded-[10px] border-[0.5px] border-ck-red/30 bg-ck-bg p-4">
                <div className="grid gap-3 sm:grid-cols-6">
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">{t('type')}</label>
                    <select
                      value={newLine.kind}
                      onChange={e => setNewLine(prev => ({ ...prev, kind: e.target.value as OfferLineKind }))}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                    >
                      {(Object.keys(KIND_KEYS) as OfferLineKind[]).map(k => (
                        <option key={k} value={k}>{t(KIND_KEYS[k])}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] text-ck-text-muted">{t('description')} *</label>
                    <input
                      type="text"
                      value={newLine.description}
                      onChange={e => setNewLine(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                      placeholder={t('description')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">{t('quantity')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newLine.quantity}
                      onChange={e => setNewLine(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">{t('unitPrice')}</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={newLine.unit_price_cents}
                      onChange={e => setNewLine(prev => ({ ...prev, unit_price_cents: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text tabular-nums focus:border-ck-red focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ck-text-muted">{t('vat')}</label>
                    <select
                      value={newLine.tax_code}
                      onChange={e => setNewLine(prev => ({ ...prev, tax_code: e.target.value as TaxCode }))}
                      className="w-full rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text focus:border-ck-red focus:outline-none"
                    >
                      <option value="H21">21%</option>
                      <option value="L9">9%</option>
                      <option value="N0">0%</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddLine}
                    disabled={acting || !newLine.description.trim()}
                    className="rounded-[10px] bg-ck-red px-4 py-1.5 text-sm font-medium text-white hover:bg-ck-red-hover disabled:opacity-50"
                  >
                    {tCommon('add')}
                  </button>
                  <button
                    onClick={() => setShowAddLine(false)}
                    className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            )}

            {offer.offer_lines.length === 0 ? (
              <div className="flex h-24 items-center justify-center">
                <p className="text-sm text-ck-text-muted">{t('noLines')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ck-border text-left text-[10px] uppercase tracking-wider text-ck-text-muted">
                      <th className="pb-2 pr-3 font-medium">#</th>
                      <th className="pb-2 pr-3 font-medium">{t('type')}</th>
                      <th className="pb-2 pr-3 font-medium">{t('description')}</th>
                      <th className="pb-2 pr-3 font-medium text-right">{t('quantity')}</th>
                      <th className="pb-2 pr-3 font-medium text-right">{t('unitPrice')}</th>
                      <th className="pb-2 pr-3 font-medium text-right">{t('discount')}</th>
                      <th className="pb-2 pr-3 font-medium text-right">{t('vat')}</th>
                      <th className="pb-2 font-medium text-right">{t('total')}</th>
                      {isDraft && <th className="pb-2 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {offer.offer_lines.map((line, idx) => (
                      <tr key={line.id} className="border-b border-ck-divider last:border-0">
                        <td className="py-2.5 pr-3 font-mono text-xs tabular-nums text-ck-text-muted">{idx + 1}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[10px] text-ck-text-3">{t(KIND_KEYS[line.kind])}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-sm text-ck-text-2">
                          {line.description}
                          {line.part_number && (
                            <span className="ml-2 font-mono text-[10px] text-ck-text-muted">{line.part_number}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-3">
                          {Number(line.quantity)} {line.unit}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-3">
                          {formatCents(line.unit_price_cents)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-muted">
                          {Number(line.discount_pct) > 0 ? `${Number(line.discount_pct)}%` : '—'}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-ck-text-muted">
                          {formatCents(line.vat_amount_cents)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-sm tabular-nums text-ck-text-2">
                          {formatCents(line.line_total_cents)}
                        </td>
                        {isDraft && (
                          <td className="py-2.5 pl-2">
                            <button
                              onClick={() => handleRemoveLine(line.id)}
                              disabled={acting}
                              className="text-ck-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 border-t border-ck-divider pt-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex w-52 justify-between text-sm">
                  <span className="text-ck-text-muted">{t('subtotal')}</span>
                  <span className="font-mono tabular-nums text-ck-text-2">{formatCents(offer.subtotal_cents)}</span>
                </div>
                {offer.discount_cents > 0 && (
                  <div className="flex w-52 justify-between text-sm">
                    <span className="text-ck-text-muted">{t('discount')}</span>
                    <span className="font-mono tabular-nums text-red-400">-{formatCents(offer.discount_cents)}</span>
                  </div>
                )}
                <div className="flex w-52 justify-between text-sm">
                  <span className="text-ck-text-muted">{t('vat')}</span>
                  <span className="font-mono tabular-nums text-ck-text-2">{formatCents(offer.vat_cents)}</span>
                </div>
                <div className="flex w-52 justify-between border-t border-ck-divider pt-1 text-sm font-medium">
                  <span className="text-ck-text">{t('total')}</span>
                  <span className="font-mono tabular-nums text-ck-text">{formatCents(offer.total_cents)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Links */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{tCommon('details')}</h2>
            <div className="space-y-2">
              {offer.customers && (
                <SideLink href={`/app/klanten/${offer.customers.id}`} label={t('customer')} value={offer.customers.name} />
              )}
              {offer.vehicles && (
                <SideLink
                  href={`/app/voertuigen/${offer.vehicles.id}`}
                  label={t('vehicle')}
                  value={offer.vehicles.kenteken ?? `${offer.vehicles.make ?? ''} ${offer.vehicles.model ?? ''}`}
                />
              )}
              {offer.job_id && (
                <SideLink href={`/app/jobs/${offer.job_id}`} label={tCommon('job')} value={offer.job_id.slice(0, 8)} />
              )}
              {offer.lead_id && (
                <SideLink href={`/app/leads/${offer.lead_id}`} label="Lead" value={offer.lead_id.slice(0, 8)} />
              )}
              {offer.supersedes_id && (
                <SideLink href={`/app/offertes/${offer.supersedes_id}`} label={t('supersede')} value={offer.supersedes_id.slice(0, 8)} />
              )}
            </div>
          </div>

          {/* Version chain */}
          {offer.chain && offer.chain.length > 1 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">{t('chain')}</h2>
              <div className="space-y-2">
                {offer.chain.map(c => (
                  <Link
                    key={c.id}
                    href={`/app/offertes/${c.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      c.id === offer.id ? 'bg-ck-surface-3 text-ck-text' : 'text-ck-text-3 hover:bg-ck-surface-2'
                    }`}
                  >
                    <span className="font-mono text-xs tabular-nums">{c.offer_number ?? tCommon('draft').toUpperCase()}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] ${STATUS_COLORS[c.status]}`}>
                      {t(STATUS_KEYS[c.status])}
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
