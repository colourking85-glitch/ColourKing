'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Send, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDateTimeLocal, type SupportedLocale } from '@/lib/format';

type ThreadMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  to_email: string | null;
  subject: string | null;
  body: string;
  full: string | null;
  at: string;
};

/**
 * Email conversation with the lead's customer: everything sent from here
 * (tagged [LD-xxxx]) and every reply the inbox poller linked to this lead.
 */
export function LeadEmailThread({ leadId, leadNumber, contactEmail }: {
  leadId: string;
  leadNumber: number | null;
  contactEmail: string;
}) {
  const t = useTranslations('ld');
  const locale = useLocale() as SupportedLocale;
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'sent' | 'failed' | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (poll: boolean) => {
    if (poll) setChecking(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/emails${poll ? '?poll=1' : ''}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages ?? []);
        setLastPolledAt(json.lastPolledAt ?? null);
      }
    } finally {
      setLoading(false);
      if (poll) setChecking(false);
    }
  }, [leadId]);

  // Show what we have immediately, then check the inbox for new replies
  useEffect(() => {
    load(false).then(() => load(true));
  }, [load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, subject: subject.trim() || undefined }),
      });
      if (res.ok) {
        const { entry } = await res.json();
        setMessages(prev => [...prev, entry]);
        setText('');
        setSubject('');
        setStatus('sent');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    } finally {
      setSending(false);
    }
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const tag = leadNumber != null ? `[LD-${String(leadNumber).padStart(4, '0')}]` : '';
  const lastSubject = [...messages].reverse().find(m => m.subject)?.subject;

  return (
    <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted">
          <Mail size={14} />
          {t('emailThread')}
          {messages.length > 0 && (
            <span className="rounded-full bg-ck-dark-surface px-1.5 py-0.5 text-[10px] font-normal text-ck-muted">{messages.length}</span>
          )}
        </h2>
        <button
          onClick={() => load(true)}
          disabled={checking}
          title={lastPolledAt ? `${t('lastChecked')}: ${formatDateTimeLocal(lastPolledAt, locale).time}` : undefined}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ck-muted-light hover:bg-ck-dark-surface hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
          {checking ? t('checkingReplies') : t('checkReplies')}
        </button>
      </div>

      {/* Conversation */}
      <div ref={listRef} className="mb-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <p className="py-4 text-center text-xs text-ck-muted">…</p>
        ) : messages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ck-dark-border p-4 text-center text-xs text-ck-muted">
            {t('emailThreadEmpty')}
          </p>
        ) : (
          messages.map(m => {
            const out = m.direction === 'outbound';
            const c = formatDateTimeLocal(m.at, locale);
            const open = expanded.has(m.id);
            return (
              <div
                key={m.id}
                className={`rounded-lg border p-3 text-xs ${
                  out ? 'ml-4 border-ck-red/20 bg-ck-red/5' : 'mr-4 border-ck-dark-border bg-ck-dark-surface'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-ck-muted">
                  <span className="flex min-w-0 items-center gap-1">
                    {out ? <ArrowUpRight size={11} className="shrink-0 text-ck-red" /> : <ArrowDownLeft size={11} className="shrink-0 text-blue-400" />}
                    <span className="truncate">{out ? `${t('emailFromUs')} → ${m.to_email ?? contactEmail}` : m.from_email}</span>
                  </span>
                  <span className="shrink-0 font-mono" title={c.timeZone}>{c.date} {c.time} {c.zone}</span>
                </div>
                {m.subject && <div className="mb-1 truncate font-medium text-ck-muted-light">{m.subject}</div>}
                <div className="whitespace-pre-wrap break-words text-white">{open && m.full ? m.full : m.body}</div>
                {m.full && (
                  <button onClick={() => toggle(m.id)} className="mt-1 text-[10px] text-ck-muted hover:text-white">
                    {open ? t('hideFullEmail') : t('showFullEmail')}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <p className="mb-2 text-xs text-ck-text-3">{t('emailTo')}: {contactEmail}</p>
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder={`${tag} ${lastSubject ? `Re: ${lastSubject.replace(/\[LD-#?\d+\]\s*/i, '').replace(/^re:\s*/i, '')}` : t('emailSubjectAuto')}`}
        className="mb-2 w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-1.5 text-xs text-white placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder={t('replyPlaceholder')}
        className="w-full resize-y rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
        >
          <Send size={12} />
          {sending ? t('emailSending') : t('sendReply')}
        </button>
        {status === 'sent' && <span className="text-xs text-green-400">{t('replySent')}</span>}
        {status === 'failed' && <span className="text-xs text-red-400">{t('emailFailed')}</span>}
      </div>
    </div>
  );
}
