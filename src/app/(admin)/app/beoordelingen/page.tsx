'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search, Star, Clock, CheckCircle, Eye, EyeOff, Send, MessageSquare,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type ReviewRow = {
  id: string;
  rating: number | null;
  comment: string | null;
  review_token: string;
  locale: string;
  requested_at: string;
  responded_at: string | null;
  published: boolean;
  created_at: string;
  customers: { id: string; name: string; email: string | null } | null;
  jobs: { id: string; number: number | null } | null;
};

type StatusFilter = 'all' | 'pending' | 'responded' | 'published';

const TABS: { key: StatusFilter; icon: typeof Star }[] = [
  { key: 'all', icon: MessageSquare },
  { key: 'pending', icon: Clock },
  { key: 'responded', icon: CheckCircle },
  { key: 'published', icon: Eye },
];

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= count ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReviewsDashboard() {
  const t = useTranslations('rv');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tab !== 'all') params.set('status', tab);
    fetch(`/api/reviews?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [search, tab]);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (id: string, published: boolean) => {
    await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, published }),
    });
    load();
  };

  const avgRating = reviews.filter(r => r.rating).reduce((s, r) => s + (r.rating ?? 0), 0) / (reviews.filter(r => r.rating).length || 1);
  const respondedCount = reviews.filter(r => r.responded_at).length;
  const publishedCount = reviews.filter(r => r.published).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-medium text-ck-text">{t('title')}</h1>
          <ScreenBadge code="RV05" />
        </div>
        <p className="mt-0.5 text-[11px] text-ck-text-muted">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-ck-panel border border-ck-dark-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-ck-muted">{t('totalRequests')}</p>
          <p className="text-lg font-semibold text-ck-text">{reviews.length}</p>
        </div>
        <div className="rounded-lg bg-ck-panel border border-ck-dark-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-ck-muted">{t('responses')}</p>
          <p className="text-lg font-semibold text-ck-text">{respondedCount}</p>
        </div>
        <div className="rounded-lg bg-ck-panel border border-ck-dark-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-ck-muted">{t('avgRating')}</p>
          <p className="text-lg font-semibold text-ck-text">{avgRating ? avgRating.toFixed(1) : '—'}</p>
        </div>
        <div className="rounded-lg bg-ck-panel border border-ck-dark-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-ck-muted">{t('publishedCount')}</p>
          <p className="text-lg font-semibold text-ck-text">{publishedCount}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === key
                  ? 'bg-ck-red text-white'
                  : 'bg-ck-surface-3 text-ck-muted hover:text-ck-text'
              }`}
            >
              <Icon size={13} />
              {t(`tab_${key}`)}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-panel pl-9 pr-3 py-2 text-sm text-ck-text placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ck-red border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-ck-dark-border bg-ck-panel p-8 text-center">
          <MessageSquare size={32} className="mx-auto mb-2 text-ck-muted" />
          <p className="text-sm text-ck-muted">{t('empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-ck-dark-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-ck-surface-3 text-[11px] uppercase tracking-wider text-ck-muted">
              <tr>
                <th className="px-4 py-2.5">{t('colCustomer')}</th>
                <th className="px-4 py-2.5">{t('colJob')}</th>
                <th className="px-4 py-2.5">{t('colRating')}</th>
                <th className="px-4 py-2.5">{t('colComment')}</th>
                <th className="px-4 py-2.5">{t('colDate')}</th>
                <th className="px-4 py-2.5">{t('colStatus')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ck-dark-border bg-ck-panel">
              {reviews.map(r => {
                const customer = (Array.isArray(r.customers) ? r.customers[0] : r.customers) as ReviewRow['customers'];
                const job = (Array.isArray(r.jobs) ? r.jobs[0] : r.jobs) as ReviewRow['jobs'];
                return (
                  <tr key={r.id} className="hover:bg-ck-surface-3/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ck-text">
                      {customer?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ck-muted">
                      {job?.number ? `JB-${String(job.number).padStart(4, '0')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.rating ? <Stars count={r.rating} /> : <span className="text-ck-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ck-text max-w-xs truncate">
                      {r.comment || <span className="text-ck-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ck-muted whitespace-nowrap">
                      {r.responded_at ? formatDate(r.responded_at) : formatDate(r.requested_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!r.responded_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-400">
                          <Send size={10} />
                          {t('statusPending')}
                        </span>
                      ) : r.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
                          <Eye size={10} />
                          {t('statusPublished')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                          <CheckCircle size={10} />
                          {t('statusReceived')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.responded_at && (
                        <button
                          onClick={() => togglePublish(r.id, !r.published)}
                          className="rounded-lg p-1.5 text-ck-muted hover:bg-ck-surface-3 hover:text-ck-text transition-colors"
                          title={r.published ? t('unpublish') : t('publish')}
                        >
                          {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
