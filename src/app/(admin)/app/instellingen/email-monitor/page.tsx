'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SentEmailsTable } from '@/components/email/SentEmailsTable';

interface ImapConfig {
  name: string;
  schedule: string;
  inbox: string;
  host: string;
}

interface EmailEntry {
  id: string;
  direction: 'inbound' | 'outbound';
  to_email: string | null;
  entity_type: string;
  entity_id: string;
  from_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  created_at: string;
}

interface PollResult {
  ok: boolean;
  processed?: number;
  skippedDedup?: number;
  error?: string;
  logs?: string[];
  throttled?: boolean;
}

function useCountdown() {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    function calc() {
      // Daily cron at 08:00 UTC (vercel.json)
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(8, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      const diff = Math.round((next.getTime() - now.getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m ${diff % 60}s`);
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);
  return countdown;
}

export default function EmailMonitorPage() {
  const t = useTranslations('imap');
  const bcp = ({ nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR' } as Record<string, string>)[useLocale()] ?? 'nl-NL';
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PollResult | null>(null);
  const [config, setConfig] = useState<ImapConfig | null>(null);
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<PollResult | null>(null);
  const [pollLogs, setPollLogs] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const countdown = useCountdown();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email/imap-log');
      const json = await res.json();
      setConfig(json.imapConfig);
      setEmails(json.recentEmails ?? []);
      setLastPolledAt(json.lastPolledAt ?? null);
      setLastResult(json.lastResult ?? null);
      setPollLogs(prev => (prev.length ? prev : json.lastResult?.logs ?? []));
      setLastRefreshed(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function triggerPoll() {
    setPolling(true);
    setPollResult(null);
    setPollLogs([]);
    try {
      const res = await fetch('/api/email/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const json: PollResult = await res.json();
      setPollResult(json);
      setPollLogs(json.logs ?? []);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPollResult({ ok: false, error: msg });
    } finally {
      setPolling(false);
    }
  }

  const entityRoute: Record<string, string> = {
    lead: '/app/leads',
    job: '/app/jobs',
    invoice: '/app/facturen',
    offer: '/app/offertes',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="SY25" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-ck-muted-light">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ck-muted-light" suppressHydrationWarning>
            {lastRefreshed
              ? lastRefreshed.toLocaleTimeString(bcp, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : ''}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:bg-ck-dark-surface"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['inbox', 'sent'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === k ? 'bg-ck-red text-white' : 'border border-ck-dark-border bg-ck-dark-card text-ck-muted-light hover:text-white'
            }`}
          >
            {k === 'inbox' ? t('tabInbox') : t('tabSent')}
          </button>
        ))}
      </div>

      {tab === 'sent' && (
        <div className="space-y-2">
          <p className="text-xs text-ck-muted-light">{t('sentDesc')}</p>
          <SentEmailsTable />
        </div>
      )}

      {tab === 'inbox' && (<>
      {/* Cron Job Info Card */}
      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        <div className="flex items-center gap-2 border-b border-ck-dark-border px-5 py-3">
          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-white">{t('cronTitle')}</span>
        </div>
        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: t('jobName'), value: config?.name ?? 'imap-inbox-poll', mono: true },
              { label: t('schedule'), value: config?.schedule ?? '0 8 * * *', mono: true },
              { label: t('frequency'), value: t('frequencyValue') },
              { label: t('inbox'), value: config?.inbox ?? 'info@colourking.nl', mono: true },
              { label: t('imapHost'), value: config?.host ?? 'imappro.zoho.eu:993', mono: true },
              {
                label: t('lastPolledAt'),
                value: lastPolledAt
                  ? new Date(lastPolledAt).toLocaleString(bcp, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : t('never'),
                mono: true,
              },
              {
                label: t('status'),
                value: !lastResult ? '—' : lastResult.ok ? t('statusOk') : `${t('statusError')}: ${lastResult.error ?? ''}`,
                mono: false,
              },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-ck-dark-surface px-3 py-2.5">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-ck-muted-light">{row.label}</div>
                <div className={`text-xs text-white ${row.mono ? 'font-mono' : ''} break-all`}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Next run + Poll Now */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-1.5 text-xs text-ck-muted-light">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('nextRun')}: <span className="ml-1 font-mono text-amber-300" suppressHydrationWarning>{countdown}</span>
            </div>
            <button
              onClick={triggerPoll}
              disabled={polling}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${polling ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {polling ? t('polling') : t('pollNow')}
            </button>
            {pollResult && (
              <span
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  pollResult.ok
                    ? 'border-green-700/40 bg-green-900/30 text-green-300'
                    : 'border-red-700/40 bg-red-900/30 text-red-300'
                }`}
              >
                {pollResult.throttled
                  ? t('throttled')
                  : pollResult.ok
                    ? `OK — ${t('processed')} ${pollResult.processed} email(s)`
                    : `Error: ${pollResult.error}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Poll Log */}
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
          <div className="flex items-center gap-2 border-b border-ck-dark-border px-5 py-3">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-white">{t('pollLog')}</span>
            <span className="ml-auto rounded-full border border-ck-dark-border px-2 py-0.5 text-[10px] text-ck-muted-light">
              {t('lastPoll')}
            </span>
          </div>
          <div className="p-4">
            {pollLogs.length === 0 ? (
              <div className="py-4 text-center text-xs italic text-ck-muted-light">
                {t('noLogs')}
              </div>
            ) : (
              <div className="max-h-80 space-y-0.5 overflow-y-auto rounded-lg bg-ck-dark-bg p-3 font-mono text-[11px]">
                {pollLogs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('ERROR') || line.includes('FATAL')
                        ? 'text-red-400'
                        : line.includes('Processed')
                          ? 'text-green-400'
                          : line.includes('Connected')
                            ? 'text-emerald-400'
                            : line.includes('SKIP')
                              ? 'text-amber-300'
                              : 'text-ck-muted-light'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Captured Email Replies */}
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
          <div className="flex items-center gap-2 border-b border-ck-dark-border px-5 py-3">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-white">{t('capturedReplies')}</span>
            <span className="ml-auto rounded-full border border-ck-dark-border px-2 py-0.5 text-[10px] text-ck-muted-light">
              {emails.length} {t('recent')}
            </span>
          </div>
          <div className="p-4">
            {emails.length === 0 ? (
              <div className="py-4 text-center text-xs italic text-ck-muted-light">
                {t('noEmails')}
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {emails.map((item) => (
                  <div key={item.id} className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${
                          item.direction === 'outbound' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-300'
                        }`}>
                          {item.direction === 'outbound' ? t('sent') : t('received')}
                        </span>
                        <span className="truncate font-mono text-[11px] text-blue-300">
                          {item.direction === 'outbound' ? item.to_email : item.from_email}
                        </span>
                      </span>
                      <a
                        href={`${entityRoute[item.entity_type] || '/app'}/${item.entity_id}`}
                        className="flex shrink-0 items-center gap-0.5 text-[10px] text-ck-muted-light hover:text-white"
                      >
                        {item.entity_type.charAt(0).toUpperCase() + item.entity_type.slice(1)}
                        <svg className="ml-0.5 h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    {item.subject && (
                      <div className="mb-1 truncate text-[11px] font-medium text-white">{item.subject}</div>
                    )}
                    {item.snippet && (
                      <div className="line-clamp-2 text-[10px] italic text-ck-muted-light">{item.snippet}</div>
                    )}
                    <div className="mt-1.5 font-mono text-[10px] text-ck-muted-light" suppressHydrationWarning>
                      {new Date(item.received_at ?? item.created_at).toLocaleString(bcp, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
}
