'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, RefreshCw, CheckCircle2, XCircle, Info } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type CronCategory = 'notifications' | 'data_sync' | 'maintenance';

/** Mirrors vercel.json — the schedule there is the source of truth (UTC). */
const CRON_JOBS: Array<{
  id: string;
  name: string;
  description: string;
  schedule: string;
  scheduleHuman: string;
  category: CronCategory;
  endpoint: string;
  timeout: number;
  manual: boolean;
  logHref?: string;
}> = [
  {
    id: 'reminders',
    name: 'Reminder emails',
    description: 'Customer reminders: invoice due soon / overdue (auto-marks overdue), quote expiring, appointment (e.g. 24 h + 2 h before), vehicle ready catch-up. Moments are set in SY01 > E-mail, log in SY60. Idempotent — safe to call every 15 min. Vercel Hobby only allows the daily run; for hour-based moments add an external scheduler (e.g. cron-job.org) that POSTs this endpoint every 15 min with header "Authorization: Bearer <CRON_SECRET>".',
    schedule: '0 7 * * *',
    scheduleHuman: 'Vercel: daily 09:00 Europe/Amsterdam (07:00 UTC) — plus external every 15 min for hour-based moments',
    category: 'notifications',
    endpoint: '/api/cron/reminders',
    timeout: 300,
    manual: true,
    logHref: '/app/instellingen/herinneringen',
  },
  {
    id: 'imap-poll',
    name: 'IMAP inbox poll',
    description: 'Reads info@colourking.nl and links replies to leads, jobs, offers and invoices by their subject tag.',
    schedule: '0 8 * * *',
    scheduleHuman: 'Daily 08:00 UTC',
    category: 'data_sync',
    endpoint: '/api/email/imap-poll',
    timeout: 60,
    manual: false,
    logHref: '/app/instellingen/email-monitor',
  },
  {
    id: 'db-cleanup',
    name: 'Database cleanup',
    description: 'Deletes website analytics sessions and pageviews older than 3 months. Never touches business data.',
    schedule: '0 2 * * 0',
    scheduleHuman: 'Weekly, Sunday 02:00 UTC',
    category: 'maintenance',
    endpoint: '/api/cron/db-cleanup',
    timeout: 300,
    manual: true,
  },
];

const CATEGORY_STYLES: Record<CronCategory, { label: string; class: string }> = {
  notifications: { label: 'Notifications', class: 'bg-amber-900/30 text-amber-400' },
  data_sync: { label: 'Data Sync', class: 'bg-purple-900/30 text-purple-400' },
  maintenance: { label: 'Maintenance', class: 'bg-slate-700/30 text-slate-400' },
};

type LastRun = { at: string; ok: boolean; summary: string } | null;

export default function CronJobsPage() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, LastRun>>({});

  const loadReminderLast = useCallback(async () => {
    const res = await fetch('/api/reminders/state');
    if (!res.ok) return;
    const s = await res.json();
    if (s?.last_run_at) {
      setResults((prev) => ({
        ...prev,
        reminders: {
          at: s.last_run_at,
          ok: s.ok !== false,
          summary: `${s.trigger === 'cron' ? 'scheduler' : 'manual'} · ${s.evaluated ?? 0} evaluated, ${s.sent ?? 0} sent, ${s.skipped ?? 0} skipped, ${s.failed ?? 0} failed${s.error ? ` — ${s.error}` : ''}`,
        },
      }));
    }
  }, []);

  useEffect(() => { loadReminderLast(); }, [loadReminderLast]);

  async function triggerRun(job: (typeof CRON_JOBS)[number]) {
    setRunningId(job.id);
    try {
      const res = await fetch(job.endpoint, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      const summary = job.id === 'reminders'
        ? `${body.sent ?? 0} sent, ${body.skipped ?? 0} skipped, ${body.failed ?? 0} failed`
        : JSON.stringify(body).slice(0, 120);
      setResults((prev) => ({ ...prev, [job.id]: { at: new Date().toISOString(), ok: res.ok, summary: res.ok ? summary : body.error ?? res.statusText } }));
    } catch (e) {
      setResults((prev) => ({ ...prev, [job.id]: { at: new Date().toISOString(), ok: false, summary: String(e) } }));
    }
    setRunningId(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium text-white">Cron Jobs</h1>
        <ScreenBadge code="SY15" />
      </div>
      <p className="text-sm text-[#6b6b80]">
        Scheduled jobs defined in <span className="font-mono">vercel.json</span>. Vercel calls each endpoint with <span className="font-mono">Authorization: Bearer CRON_SECRET</span>; admins can run them here.
      </p>

      <div className="space-y-3">
        {CRON_JOBS.map((job) => {
          const last = results[job.id] ?? null;
          return (
            <div key={job.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-medium text-white">{job.name}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-xs ${CATEGORY_STYLES[job.category].class}`}>{CATEGORY_STYLES[job.category].label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#6b6b80]">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#6b6b80]">
                    <span><span className="text-white">Schedule:</span> {job.scheduleHuman} <span className="ml-1 font-mono text-[#3a3a50]">({job.schedule})</span></span>
                    <span><span className="text-white">Endpoint:</span> <span className="font-mono">{job.endpoint}</span></span>
                    <span><span className="text-white">Timeout:</span> {job.timeout}s</span>
                    {last && (
                      <span className="flex items-center gap-1">
                        <span className="text-white">Last:</span> {new Date(last.at).toLocaleString('nl-NL')}
                        {last.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                        <span className="text-[#6b6b80]">— {last.summary}</span>
                      </span>
                    )}
                    {job.logHref && <Link href={job.logHref} className="underline hover:text-white">Log</Link>}
                  </div>
                </div>
                {job.manual && (
                  <button
                    onClick={() => triggerRun(job)}
                    disabled={runningId === job.id}
                    className="rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] p-2 text-[#6b6b80] transition-colors hover:text-white disabled:opacity-50"
                    title="Run now"
                  >
                    {runningId === job.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
        <Info className="mt-0.5 h-4 w-4 text-[#6b6b80]" />
        <p className="text-xs text-[#6b6b80]">
          Vercel cron runs in UTC. The reminder job is scheduled for 07:00 UTC, which is 09:00 in summer and 08:00 in winter. Set <span className="font-mono">CRON_SECRET</span> in Vercel — the routes refuse to run without it.
        </p>
      </div>
    </div>
  );
}
