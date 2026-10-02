'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Headphones, Plus, RefreshCw, Send, ArrowLeft, ChevronDown,
  AlertCircle, Clock, CheckCircle2, XCircle, MessageSquare,
  Monitor, Globe, MapPin, Bug, HelpCircle, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type CasePriority = 'low' | 'normal' | 'high' | 'critical';
type CaseCategory = 'access_problem' | 'bug' | 'question' | 'feature_request' | 'other';

interface SupportCase {
  id: number;
  case_number: string;
  subject: string;
  description: string;
  category: string;
  priority: CasePriority;
  status: string;
  channel_kind: string;
  user_email: string;
  user_name: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

interface CaseMessage {
  id: number;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
}

interface CaseDetail {
  case: SupportCase;
  messages: CaseMessage[];
  context: Record<string, unknown> | null;
}

type View = 'list' | 'create' | 'detail';

const PRIORITY_STYLES: Record<CasePriority, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  triage: 'bg-yellow-500/20 text-yellow-400',
  assigned: 'bg-purple-500/20 text-purple-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  waiting_customer: 'bg-amber-500/20 text-amber-400',
  waiting_provider: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-zinc-500/20 text-zinc-400',
  reopened: 'bg-rose-500/20 text-rose-400',
  cancelled: 'bg-zinc-600/20 text-zinc-500',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  access_problem: AlertCircle,
  bug: Bug,
  question: HelpCircle,
  feature_request: Sparkles,
  other: MoreHorizontal,
};

function captureSupportContext() {
  return {
    app: 'colourking-admin',
    app_version: process.env.NEXT_PUBLIC_APP_VERSION,
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    os: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    locale: typeof navigator !== 'undefined' ? navigator.language : 'nl',
  };
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SupportPage() {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  const [view, setView] = useState<View>('list');
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CaseCategory>('other');
  const [priority, setPriority] = useState<CasePriority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('open');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter === 'open') {
        params.set('status', 'new,triage,assigned,in_progress,waiting_customer,waiting_provider,reopened');
      } else if (statusFilter === 'closed') {
        params.set('status', 'resolved,closed,cancelled');
      }
      const res = await fetch(`/api/support/cases?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setCases(result.cases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  async function openCase(caseNumber: string) {
    setDetailLoading(true);
    setView('detail');
    try {
      const res = await fetch(`/api/support/cases/${encodeURIComponent(caseNumber)}`);
      if (!res.ok) throw new Error('Failed to load case');
      const detail = await res.json();
      setSelectedCase(detail);
    } catch {
      setError('Failed to load case details');
      setView('list');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const ctx = captureSupportContext();
      const res = await fetch('/api/support/create-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          ...ctx,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setSubmitSuccess(result.case_number);
      setSubject('');
      setDescription('');
      setCategory('other');
      setPriority('normal');
      setTimeout(() => {
        setSubmitSuccess(null);
        setView('list');
        fetchCases();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !selectedCase) return;

    setReplying(true);
    try {
      const res = await fetch(
        `/api/support/cases/${encodeURIComponent(selectedCase.case.case_number)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: replyBody.trim() }),
        }
      );
      if (!res.ok) throw new Error('Failed to send reply');
      setReplyBody('');
      await openCase(selectedCase.case.case_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  }

  const apiConfigured = error !== 'Support API not configured';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={() => { setView('list'); setSelectedCase(null); setError(null); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Headphones size={20} className="text-ck-red" />
          <h1 className="text-lg font-semibold text-white">{t('title')}</h1>
          <ScreenBadge id="SY65" />
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <>
              <button
                onClick={fetchCases}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                title={tCommon('refresh')}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => { setView('create'); setError(null); }}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-ck-red px-3 text-[13px] font-medium text-white transition-colors hover:bg-ck-red/80"
              >
                <Plus size={14} />
                {t('newCase')}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {/* Status filter tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-white/[0.04] p-1">
            {['open', 'closed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  statusFilter === f
                    ? 'bg-ck-red/15 text-ck-red'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t(`filter.${f}`)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={20} className="animate-spin text-white/20" />
            </div>
          ) : !apiConfigured ? (
            <div className="rounded-lg border border-ck-dark-border bg-white/[0.02] px-6 py-16 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-amber-400/60" />
              <p className="text-[14px] font-medium text-white/60">{t('notConfigured')}</p>
              <p className="mt-1 text-[12px] text-white/30">{t('notConfiguredHint')}</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="rounded-lg border border-ck-dark-border bg-white/[0.02] px-6 py-16 text-center">
              <Headphones size={32} className="mx-auto mb-3 text-white/10" />
              <p className="text-[14px] font-medium text-white/40">{t('noCases')}</p>
              <button
                onClick={() => setView('create')}
                className="mt-3 text-[13px] text-ck-red hover:underline"
              >
                {t('createFirst')}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {cases.map((c) => {
                const CatIcon = CATEGORY_ICONS[c.category] || MoreHorizontal;
                return (
                  <button
                    key={c.id}
                    onClick={() => openCase(c.case_number)}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-ck-dark-border hover:bg-white/[0.06]"
                  >
                    <CatIcon size={16} className="flex-shrink-0 text-white/20" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-white/30">{c.case_number}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${PRIORITY_STYLES[c.priority]}`}>
                          {t(`priority.${c.priority}`)}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${STATUS_STYLES[c.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                          {t(`status.${c.status}`)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-white/80">
                        {c.subject}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-white/20">
                      {relativeTime(c.updated_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Create View ───────────────────────────────────────────── */}
      {view === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitSuccess && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-[13px] text-green-400">
              {t('caseCreated', { number: submitSuccess })}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/50">
              {t('fields.subject')} *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={500}
              required
              className="w-full rounded-lg border border-ck-dark-border bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:border-ck-red/50 focus:outline-none"
              placeholder={t('placeholders.subject')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/50">
              {t('fields.description')} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={50000}
              required
              rows={6}
              className="w-full rounded-lg border border-ck-dark-border bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:border-ck-red/50 focus:outline-none"
              placeholder={t('placeholders.description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/50">
                {t('fields.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CaseCategory)}
                className="w-full rounded-lg border border-ck-dark-border bg-white/[0.04] px-3 py-2 text-[13px] text-white focus:border-ck-red/50 focus:outline-none"
              >
                <option value="other">{t('category.other')}</option>
                <option value="bug">{t('category.bug')}</option>
                <option value="question">{t('category.question')}</option>
                <option value="access_problem">{t('category.access_problem')}</option>
                <option value="feature_request">{t('category.feature_request')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/50">
                {t('fields.priority')}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CasePriority)}
                className="w-full rounded-lg border border-ck-dark-border bg-white/[0.04] px-3 py-2 text-[13px] text-white focus:border-ck-red/50 focus:outline-none"
              >
                <option value="low">{t('priority.low')}</option>
                <option value="normal">{t('priority.normal')}</option>
                <option value="high">{t('priority.high')}</option>
                <option value="critical">{t('priority.critical')}</option>
              </select>
            </div>
          </div>

          {/* Context info (auto-captured, read-only) */}
          <div className="rounded-lg border border-ck-dark-border bg-white/[0.02] px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/30">
              <Monitor size={12} />
              {t('autoContext')}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-white/20">
              <div>
                <Globe size={10} className="mb-0.5 inline" /> {typeof navigator !== 'undefined' ? navigator.language : 'nl'}
              </div>
              <div>
                <MapPin size={10} className="mb-0.5 inline" /> {typeof window !== 'undefined' ? window.location.pathname : ''}
              </div>
              <div>
                <Monitor size={10} className="mb-0.5 inline" /> {typeof navigator !== 'undefined' ? navigator.platform : ''}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setView('list')}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/40 transition-colors hover:text-white/60"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-ck-red/80 disabled:opacity-50"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {t('submit')}
            </button>
          </div>
        </form>
      )}

      {/* ── Detail View ───────────────────────────────────────────── */}
      {view === 'detail' && (
        detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-white/20" />
          </div>
        ) : selectedCase ? (
          <div className="space-y-4">
            {/* Case header */}
            <div className="rounded-lg border border-ck-dark-border bg-white/[0.03] px-4 py-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[12px] text-white/30">{selectedCase.case.case_number}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[selectedCase.case.priority]}`}>
                  {t(`priority.${selectedCase.case.priority}`)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[selectedCase.case.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                  {t(`status.${selectedCase.case.status}`)}
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-white">{selectedCase.case.subject}</h2>
              <div className="mt-2 flex gap-4 text-[11px] text-white/30">
                <span>{t('fields.created')}: {new Date(selectedCase.case.created_at).toLocaleString()}</span>
                {selectedCase.case.resolved_at && (
                  <span>{t('fields.resolved')}: {new Date(selectedCase.case.resolved_at).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-[12px] font-medium text-white/40">
                <MessageSquare size={14} />
                {t('conversation')} ({selectedCase.messages.length})
              </h3>
              {selectedCase.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border px-4 py-3 ${
                    msg.sender_role === 'admin'
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : 'border-ck-dark-border bg-white/[0.03]'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-white/70">{msg.sender_name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                        msg.sender_role === 'admin'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {msg.sender_role === 'admin' ? t('agent') : t('you')}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/20">
                      {relativeTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/60">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply form */}
            {!['closed', 'cancelled'].includes(selectedCase.case.status) && (
              <form onSubmit={handleReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={t('replyPlaceholder')}
                  className="flex-1 rounded-lg border border-ck-dark-border bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:border-ck-red/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={replying || !replyBody.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ck-red text-white transition-colors hover:bg-ck-red/80 disabled:opacity-50"
                >
                  {replying ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            )}

            {/* Context panel */}
            {selectedCase.context && (
              <details className="rounded-lg border border-ck-dark-border bg-white/[0.02]">
                <summary className="cursor-pointer px-4 py-2.5 text-[12px] font-medium text-white/40">
                  {t('technicalContext')}
                </summary>
                <div className="border-t border-ck-dark-border px-4 py-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(selectedCase.context)
                      .filter(([k]) => !['case_id', 'tenant_id', 'captured_at'].includes(k))
                      .map(([key, val]) => {
                        if (!val) return null;
                        return (
                          <div key={key}>
                            <span className="text-white/30">{key}:</span>{' '}
                            <span className="text-white/50">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </details>
            )}
          </div>
        ) : null
      )}
    </div>
  );
}
