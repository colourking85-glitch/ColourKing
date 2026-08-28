'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import { QuoteTemplate } from '@/modules/offers/quote-template';
import { useTranslations } from 'next-intl';

export default function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('es');
  const [offer, setOffer] = useState<Parameters<typeof QuoteTemplate>[0]['quote'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setOffer)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-ck-text-muted">{t('notFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-3">
        <Link
          href={`/app/offertes/${id}`}
          className="flex items-center gap-1.5 text-sm text-ck-text-muted hover:text-ck-text transition-colors"
        >
          <ArrowLeft size={14} />
          {t('backToDetail')}
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors"
          >
            <Printer size={14} />
            {t('print')}
          </button>
          {offer.status === 'draft' && (
            <button
              onClick={async () => {
                const res = await fetch(`/api/offers/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'send' }),
                });
                if (res.ok) {
                  window.location.href = `/app/offertes/${id}`;
                }
              }}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
            >
              <Send size={14} />
              {t('send')}
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-white shadow-md">
        <QuoteTemplate quote={offer} />
      </div>
    </div>
  );
}
