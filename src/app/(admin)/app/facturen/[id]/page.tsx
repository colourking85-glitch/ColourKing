'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Send, CheckCircle, AlertCircle,
  File, Ban, CreditCard, Trash2, Hash, Calendar,
  User, Car, ExternalLink, Copy, Printer, Link2,
  Clock, Banknote,
} from 'lucide-react';
import type { InvoiceStatus, OfferLineKind, TaxCode, PaymentMethod } from '@/types/database';
import { InvoiceTemplate } from '@/modules/invoices/template';

type InvoiceLine = {
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

type Payment = {
  id: string;
  amount_cents: number;
  method: PaymentMethod;
  reference: string | null;
  mollie_payment_id: string | null;
  mollie_status: string | null;
  paid_at: string | null;
  created_at: string;
};

type InvoiceDetail = {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  customer_id: string;
  vehicle_id: string | null;
  job_id: string | null;
  offer_id: string | null;
  locale: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  tax_summary: Record<string, { base_cents: number; vat_cents: number; rate: number }> | null;
  due_date: string | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  mollie_payment_id: string | null;
  notes: string | null;
  terms: string | null;
  issued_at: string | null;
  sent_at: string | null;
  cancelled_at: string | null;
  credit_note_id: string | null;
  payment_token: string | null;
  created_at: string;
  updated_at: string;
  customers: {
    id: string; name: string; email: string | null; phone: string | null;
    address: string | null; postcode: string | null; city: string | null;
    country: string | null; kvk_number: string | null; btw_number: string | null;
    type: string;
  } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  staff: { id: string; name: string } | null;
  issuer: { id: string; name: string } | null;
  invoice_lines: InvoiceLine[];
  payments: Payment[];
  chain: Array<{
    id: string;
    invoice_number: string | null;
    status: InvoiceStatus;
    credit_note_id: string | null;
    created_at: string;
  }>;
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

const METHOD_LABELS: Record<string, string> = {
  ideal: 'iDEAL',
  bank_transfer: 'Overboeking',
  cash: 'Contant',
  card: 'Pinpas',
  mollie: 'Mollie',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showCreditNote, setShowCreditNote] = useState(false);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/invoices/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setInvoice(data);
        if (data) {
          setPaymentAmount(data.total_cents);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleIssue = async () => {
    setActing(true);
    const res = await fetch(`/api/invoices/${id}/issue`, { method: 'POST' });
    if (res.ok) load();
    setActing(false);
  };

  const handleCreditNote = async () => {
    if (!creditNoteReason.trim()) return;
    setActing(true);
    const res = await fetch(`/api/invoices/${id}/credit-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: creditNoteReason }),
    });
    if (res.ok) {
      const cn = await res.json();
      router.push(`/app/facturen/${cn.id}`);
    }
    setActing(false);
    setShowCreditNote(false);
  };

  const handleRecordPayment = async () => {
    if (paymentAmount <= 0) return;
    setActing(true);
    const res = await fetch(`/api/invoices/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: paymentAmount,
        method: paymentMethod,
        reference: paymentRef || null,
      }),
    });
    if (res.ok) {
      setShowPayment(false);
      load();
    }
    setActing(false);
  };

  const handleDelete = async () => {
    setActing(true);
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/facturen');
    setActing(false);
  };

  const copyPaymentLink = () => {
    if (!invoice?.payment_token) return;
    const url = `${window.location.origin}/s/${invoice.payment_token}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePrint = () => {
    setShowInvoice(true);
    setTimeout(() => window.print(), 300);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-ck-text-faint" />
        <p className="text-sm text-ck-text-muted">Factuur niet gevonden</p>
        <Link href="/app/facturen" className="text-sm text-ck-red hover:underline">
          Terug naar facturen
        </Link>
      </div>
    );
  }

  const Icon = STATUS_ICONS[invoice.status];
  const isDraft = invoice.status === 'draft';
  const isSent = invoice.status === 'sent';
  const isOverdue = invoice.status === 'overdue';
  const canPay = isSent || isOverdue;
  const canCredit = isSent || isOverdue || invoice.status === 'paid';

  // Print view
  if (showInvoice) {
    return (
      <div>
        <div className="print:hidden mb-4">
          <button
            onClick={() => setShowInvoice(false)}
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:bg-ck-surface-2 transition-colors"
          >
            <ArrowLeft size={14} />
            Terug
          </button>
        </div>
        <InvoiceTemplate invoice={invoice} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/facturen" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-lg font-medium tabular-nums text-ck-text">
                {invoice.invoice_number ?? 'CONCEPT'}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[invoice.status]}`}>
                <Icon size={10} />
                {STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              Factuur {invoice.credit_note_id ? '(Creditnota)' : ''}
            </p>
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
              Uitgeven
            </button>
          )}
          {canPay && (
            <button
              onClick={() => setShowPayment(true)}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Banknote size={14} />
              Betaling registreren
            </button>
          )}
          {canCredit && (
            <button
              onClick={() => setShowCreditNote(true)}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-orange-500/50 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              <CreditCard size={14} />
              Creditnota
            </button>
          )}
          {invoice.payment_token && invoice.status !== 'draft' && (
            <button
              onClick={copyPaymentLink}
              className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              <Link2 size={14} />
              {linkCopied ? 'Gekopieerd!' : 'Betaallink'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-text-muted hover:text-ck-text transition-colors"
          >
            <Printer size={14} />
          </button>
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

      {/* Credit note dialog */}
      {showCreditNote && (
        <div className="rounded-[10px] border-[0.5px] border-orange-500/30 bg-orange-500/5 p-4">
          <p className="mb-3 text-sm font-medium text-orange-400">Creditnota aanmaken</p>
          <p className="mb-3 text-xs text-ck-text-muted">
            Er wordt een creditnota aangemaakt die de volledige factuur crediteert. De oorspronkelijke factuur wordt gemarkeerd als gecrediteerd.
          </p>
          <input
            type="text"
            placeholder="Reden voor creditering..."
            value={creditNoteReason}
            onChange={e => setCreditNoteReason(e.target.value)}
            className="mb-3 w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-orange-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreditNote}
              disabled={acting || !creditNoteReason.trim()}
              className="rounded-[10px] bg-orange-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Creditnota aanmaken
            </button>
            <button
              onClick={() => { setShowCreditNote(false); setCreditNoteReason(''); }}
              className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Record payment dialog */}
      {showPayment && (
        <div className="rounded-[10px] border-[0.5px] border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="mb-3 text-sm font-medium text-emerald-400">Betaling registreren</p>
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] text-ck-text-muted">Bedrag (centen)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(parseInt(e.target.value) || 0)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text tabular-nums focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-0.5 text-[10px] text-ck-text-muted">{formatCents(paymentAmount)}</p>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-ck-text-muted">Methode</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-emerald-500 focus:outline-none"
              >
                <option value="bank_transfer">Overboeking</option>
                <option value="ideal">iDEAL</option>
                <option value="card">Pinpas</option>
                <option value="cash">Contant</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-ck-text-muted">Referentie</label>
              <input
                type="text"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-emerald-500 focus:outline-none"
                placeholder="Optioneel"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRecordPayment}
              disabled={acting || paymentAmount <= 0}
              className="rounded-[10px] bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Betaling registreren
            </button>
            <button
              onClick={() => setShowPayment(false)}
              className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoice preview */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-white overflow-hidden">
            <InvoiceTemplate invoice={invoice} />
          </div>

          {/* Payments */}
          {invoice.payments.length > 0 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Betalingen</h2>
              <div className="space-y-2">
                {invoice.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-ck-bg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <div>
                        <p className="text-sm text-ck-text-2">
                          {formatCents(p.amount_cents)} via {METHOD_LABELS[p.method] ?? p.method}
                        </p>
                        {p.reference && (
                          <p className="text-[10px] text-ck-text-muted">Ref: {p.reference}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-ck-text-muted">
                      {p.paid_at ? fmtDate(p.paid_at) : fmtDate(p.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Details</h2>
            <div className="space-y-3">
              <InfoRow icon={Hash} label="Factuurnummer" value={invoice.invoice_number ?? '—'} mono />
              <InfoRow icon={Calendar} label="Aangemaakt" value={fmtDate(invoice.created_at)} />
              {invoice.issued_at && <InfoRow icon={Send} label="Uitgegeven" value={fmtDate(invoice.issued_at)} />}
              {invoice.due_date && <InfoRow icon={Clock} label="Vervaldatum" value={new Date(invoice.due_date).toLocaleDateString('nl-NL')} />}
              {invoice.paid_at && <InfoRow icon={CheckCircle} label="Betaald" value={fmtDate(invoice.paid_at)} />}
              {invoice.staff && <InfoRow icon={User} label="Aangemaakt door" value={invoice.staff.name} />}
              {invoice.notes && <InfoRow icon={FileText} label="Notities" value={invoice.notes} />}
            </div>
          </div>

          {/* Links */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Koppelingen</h2>
            <div className="space-y-2">
              {invoice.customers && (
                <SideLink href={`/app/klanten/${invoice.customers.id}`} label="Klant" value={invoice.customers.name} />
              )}
              {invoice.vehicles && (
                <SideLink
                  href={`/app/voertuigen`}
                  label="Voertuig"
                  value={invoice.vehicles.kenteken ?? `${invoice.vehicles.make ?? ''} ${invoice.vehicles.model ?? ''}`}
                />
              )}
              {invoice.offer_id && (
                <SideLink href={`/app/offertes/${invoice.offer_id}`} label="Offerte" value={invoice.offer_id.slice(0, 8)} />
              )}
              {invoice.job_id && (
                <SideLink href={`/app/jobs/${invoice.job_id}`} label="Opdracht" value={invoice.job_id.slice(0, 8)} />
              )}
              {invoice.credit_note_id && (
                <SideLink href={`/app/facturen/${invoice.credit_note_id}`} label="Creditnota van" value={invoice.credit_note_id.slice(0, 8)} />
              )}
            </div>
          </div>

          {/* Document chain */}
          {invoice.chain && invoice.chain.length > 1 && (
            <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Documentketen</h2>
              <div className="space-y-2">
                {invoice.chain.map(c => (
                  <Link
                    key={c.id}
                    href={`/app/facturen/${c.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      c.id === invoice.id ? 'bg-ck-surface-3 text-ck-text' : 'text-ck-text-3 hover:bg-ck-surface-2'
                    }`}
                  >
                    <span className="font-mono text-xs tabular-nums">{c.invoice_number ?? 'CONCEPT'}</span>
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
