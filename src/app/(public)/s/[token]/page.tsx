'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';

type InvoicePublic = {
  id: string;
  invoice_number: string | null;
  status: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  due_date: string | null;
  paid_at: string | null;
  locale: string;
  customers: { id: string; name: string; email: string | null } | null;
  invoice_lines: Array<{
    id: string;
    sort_order: number;
    kind: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price_cents: number;
    discount_pct: number;
    line_total_cents: number;
    tax_code: string;
    vat_amount_cents: number;
  }>;
};

function formatCents(cents: number, locale = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatDate(iso: string, locale = 'nl-NL'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const returnStatus = searchParams.get('status');

  const [invoice, setInvoice] = useState<InvoicePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public/invoice/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Invoice not found');
        return r.json();
      })
      .then(setInvoice)
      .catch(() => setError('Invoice not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/public/invoice/${token}/pay`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not create payment');
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch {
      setError('Payment could not be initiated. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const isComplete = returnStatus === 'complete';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Company header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Colourking</h1>
          <p className="mt-1 text-sm text-gray-500">Bodyshop & Repair</p>
        </div>

        {/* Status card */}
        {(isPaid || isComplete) && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
            <h2 className="text-lg font-semibold text-emerald-900">
              {isPaid ? 'Payment received' : 'Payment processing'}
            </h2>
            <p className="mt-1 text-sm text-emerald-700">
              {isPaid
                ? 'Thank you for your payment.'
                : 'Your payment is being processed. You will receive a confirmation shortly.'}
            </p>
          </div>
        )}

        {/* Invoice card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Invoice</p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {invoice.invoice_number ?? 'DRAFT'}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            {invoice.customers && (
              <p className="mt-4 text-sm text-gray-600">{invoice.customers.name}</p>
            )}

            {invoice.due_date && (
              <p className="mt-1 text-xs text-gray-400">
                Due: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>

          {/* Line items */}
          <div className="border-b border-gray-100 p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_lines.map(line => (
                  <tr key={line.id} className="border-t border-gray-50">
                    <td className="py-2 text-gray-700">
                      {line.description}
                      <span className="ml-2 text-xs text-gray-400">
                        {Number(line.quantity)} x {formatCents(line.unit_price_cents)}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono text-gray-700">
                      {formatCents(line.line_total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-6">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono text-gray-700">{formatCents(invoice.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT</span>
                <span className="font-mono text-gray-700">{formatCents(invoice.vat_cents)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="font-mono text-gray-900">{formatCents(invoice.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Pay button */}
          {!isPaid && !isComplete && invoice.status !== 'credited' && invoice.status !== 'cancelled' && (
            <div className="border-t border-gray-100 p-6">
              {error && (
                <p className="mb-3 text-center text-sm text-red-600">{error}</p>
              )}
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                <CreditCard size={18} />
                {paying ? 'Redirecting...' : `Pay ${formatCents(invoice.total_cents)}`}
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">
                Secure payment via Mollie (iDEAL, credit card, bank transfer)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by Colourking
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Clock },
    sent: { label: 'Open', color: 'bg-blue-50 text-blue-700', icon: Clock },
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
    overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700', icon: AlertCircle },
    credited: { label: 'Credited', color: 'bg-orange-50 text-orange-700', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: AlertCircle },
  };

  const c = config[status] ?? config.draft;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.color}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}
