'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Send, Link2, Copy } from 'lucide-react';
import { InvoiceTemplate } from '@/modules/invoices/template';
import { useTranslations } from 'next-intl';

export default function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('fa');
  const [invoice, setInvoice] = useState<Parameters<typeof InvoiceTemplate>[0]['invoice'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setInvoice)
      .finally(() => setLoading(false));
  }, [id]);

  const copyPaymentLink = () => {
    if (!invoice?.payment_token) return;
    const url = `${window.location.origin}/s/${invoice.payment_token}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-ck-text-muted">{t('notFound')}</p>
      </div>
    );
  }

  const isDraft = invoice.status === 'draft';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-3">
        <Link
          href={`/app/facturen/${id}`}
          className="flex items-center gap-1.5 text-sm text-ck-text-muted hover:text-ck-text transition-colors"
        >
          <ArrowLeft size={14} />
          {t('backToDetail')}
        </Link>

        <div className="flex gap-2">
          {invoice.payment_token && !isDraft && (
            <button
              onClick={copyPaymentLink}
              className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              {linkCopied ? <Copy size={14} /> : <Link2 size={14} />}
              {linkCopied ? t('copied') : t('paymentLink')}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
          >
            <Printer size={14} />
            {t('print')}
          </button>
          {isDraft && (
            <button
              onClick={async () => {
                const res = await fetch(`/api/invoices/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'issue' }),
                });
                if (res.ok) {
                  window.location.href = `/app/facturen/${id}`;
                }
              }}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
            >
              <Send size={14} />
              {t('issue')}
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-white shadow-md">
        <InvoiceTemplate invoice={invoice} />
      </div>
    </div>
  );
}
