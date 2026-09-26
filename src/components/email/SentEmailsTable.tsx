'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';

type Row = {
  id: string;
  direction: 'inbound' | 'outbound';
  entity_type: string;
  entity_id: string | null;
  to_email: string | null;
  from_email: string;
  subject: string | null;
  snippet: string | null;
  message_id: string | null;
  received_at: string | null;
  created_at: string;
};

const ENTITY_ROUTE: Record<string, string> = {
  lead: '/app/leads', job: '/app/jobs', invoice: '/app/facturen', offer: '/app/offertes',
  appointment: '/app/afspraken', document: '/app/afleverbon', payment: '/app/facturen',
};
const ENTITY_TYPES = ['offer', 'invoice', 'payment', 'appointment', 'job', 'document', 'lead', 'test'];

function parseStatus(snippet: string | null): { template: string | null; status: 'sent' | 'failed' | 'unknown'; error: string | null } {
  const m = snippet?.match(/^\[([^\]]+)\] (sent|failed)(?::\s*(.*))?$/);
  if (!m) return { template: null, status: snippet ? 'unknown' : 'sent', error: null };
  return { template: m[1], status: m[2] as 'sent' | 'failed', error: m[3] ?? null };
}

export function SentEmailsTable() {
  const t = useTranslations('imap');
  const bcp = ({ nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR' } as Record<string, string>)[useLocale()] ?? 'nl-NL';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [days, setDays] = useState('30');

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ direction: 'outbound', limit: '300', days });
    if (q.trim()) p.set('q', q.trim());
    if (type) p.set('type', type);
    const res = await fetch(`/api/email-log?${p}`);
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }, [q, type, days]);

  useEffect(() => { load(); }, [load]);

  const selectClass = 'rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-xs text-white focus:border-ck-red focus:outline-none';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('sentSearch')}
            className="w-64 rounded-lg border border-ck-dark-border bg-ck-dark-surface py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="">{t('sentAllTypes')}</option>
          {ENTITY_TYPES.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} className={selectClass}>
          <option value="7">7 {t('days')}</option>
          <option value="30">30 {t('days')}</option>
          <option value="90">90 {t('days')}</option>
          <option value="0">{t('sentAllTime')}</option>
        </select>
        <button onClick={load} className="rounded-lg border border-ck-dark-border p-1.5 text-ck-muted hover:text-white" title={t('refresh')}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="ml-auto text-[11px] text-ck-muted-light">{rows.length} {t('sentCount')}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ck-dark-border bg-ck-dark-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-ck-dark-border text-left text-[10px] font-semibold uppercase tracking-wider text-ck-muted">
              <th className="px-3 py-2">{t('colDate')}</th>
              <th className="px-3 py-2">{t('colTo')}</th>
              <th className="px-3 py-2">{t('colFrom')}</th>
              <th className="px-3 py-2">{t('colSubject')}</th>
              <th className="px-3 py-2">{t('colTemplate')}</th>
              <th className="px-3 py-2">{t('colEntity')}</th>
              <th className="px-3 py-2">{t('colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ck-dark-border">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-ck-muted">…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center italic text-ck-muted-light">{t('noSent')}</td></tr>
            ) : rows.map((r) => {
              const s = parseStatus(r.snippet);
              const href = r.entity_id && ENTITY_ROUTE[r.entity_type] ? `${ENTITY_ROUTE[r.entity_type]}/${r.entity_id}` : null;
              return (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-ck-muted-light">
                    {new Date(r.received_at ?? r.created_at).toLocaleString(bcp, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 font-mono text-blue-300">{r.to_email ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-ck-muted-light">{r.from_email}</td>
                  <td className="max-w-[320px] truncate px-3 py-2 text-white" title={r.subject ?? ''}>{r.subject ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-ck-muted">{s.template ?? '—'}</td>
                  <td className="px-3 py-2">
                    {href ? <Link href={href} className="text-ck-red hover:underline">{r.entity_type}</Link> : <span className="text-ck-muted">{r.entity_type}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md px-2 py-0.5 ${s.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`} title={s.error ?? ''}>
                      {s.status === 'failed' ? t('statusFailed') : t('sent')}
                    </span>
                    {s.error && <span className="ml-2 text-[10px] text-red-400">{s.error}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
