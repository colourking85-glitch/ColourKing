'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Play, Pause, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type CronStatus = 'active' | 'paused' | 'error';
type CronCategory = 'monitoring' | 'data_sync' | 'notifications' | 'maintenance';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  scheduleHuman: string;
  category: CronCategory;
  status: CronStatus;
  lastRun: string | null;
  lastResult: 'success' | 'error' | null;
  nextRun: string;
  endpoint: string;
  timeout: number;
}

const CRON_JOBS: CronJob[] = [
  {
    id: 'health-check',
    name: 'System Health Check',
    description: 'Pings all API endpoints and checks Supabase connection, Mollie API, and Resend service availability.',
    schedule: '*/5 * * * *',
    scheduleHuman: 'Every 5 minutes',
    category: 'monitoring',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/health-check',
    timeout: 30,
  },
  {
    id: 'overdue-invoices',
    name: 'Overdue Invoice Check',
    description: 'Scans sent invoices past their due date and updates status to "overdue". Triggers notification to office staff.',
    schedule: '0 8 * * *',
    scheduleHuman: 'Daily at 08:00',
    category: 'notifications',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/overdue-invoices',
    timeout: 60,
  },
  {
    id: 'appointment-reminders',
    name: 'Appointment Reminders',
    description: 'Sends reminder emails to customers with confirmed appointments for the next day via Resend.',
    schedule: '0 16 * * *',
    scheduleHuman: 'Daily at 16:00',
    category: 'notifications',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/appointment-reminders',
    timeout: 120,
  },
  {
    id: 'rdw-sync',
    name: 'RDW Vehicle Data Sync',
    description: 'Re-checks RDW data for all vehicles updated in the last 30 days to catch status changes (e.g., WOK flag updates).',
    schedule: '0 3 * * 0',
    scheduleHuman: 'Weekly on Sunday at 03:00',
    category: 'data_sync',
    status: 'paused',
    lastRun: null,
    lastResult: null,
    nextRun: 'Paused',
    endpoint: '/api/cron/rdw-sync',
    timeout: 300,
  },
  {
    id: 'mollie-payment-sync',
    name: 'Mollie Payment Sync',
    description: 'Reconciles payment statuses with Mollie API. Catches missed webhooks and updates invoice payment status accordingly.',
    schedule: '*/30 * * * *',
    scheduleHuman: 'Every 30 minutes',
    category: 'data_sync',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/mollie-sync',
    timeout: 60,
  },
  {
    id: 'stale-leads',
    name: 'Stale Lead Alerts',
    description: 'Flags leads in "new" or "contacted" status for more than 48 hours. Creates a notification for follow-up.',
    schedule: '0 9 * * 1-5',
    scheduleHuman: 'Weekdays at 09:00',
    category: 'notifications',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/stale-leads',
    timeout: 30,
  },
  {
    id: 'blocking-parts',
    name: 'Blocking Parts Alert',
    description: 'Checks for parts with "needed" or "ordered" status for more than 5 business days. Notifies workshop manager.',
    schedule: '0 10 * * 1-5',
    scheduleHuman: 'Weekdays at 10:00',
    category: 'notifications',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/blocking-parts',
    timeout: 30,
  },
  {
    id: 'db-cleanup',
    name: 'Database Cleanup',
    description: 'Removes expired sessions, old notification records (>90 days), and orphaned file uploads. Does NOT delete any business data.',
    schedule: '0 2 * * 0',
    scheduleHuman: 'Weekly on Sunday at 02:00',
    category: 'maintenance',
    status: 'paused',
    lastRun: null,
    lastResult: null,
    nextRun: 'Paused',
    endpoint: '/api/cron/db-cleanup',
    timeout: 300,
  },
  {
    id: 'vat-period-check',
    name: 'VAT Period Deadline Alert',
    description: 'Checks for upcoming VAT filing deadlines (14 days before due date) and notifies admin users.',
    schedule: '0 9 1 * *',
    scheduleHuman: 'Monthly on the 1st at 09:00',
    category: 'notifications',
    status: 'active',
    lastRun: null,
    lastResult: null,
    nextRun: 'Pending setup',
    endpoint: '/api/cron/vat-deadline',
    timeout: 30,
  },
  {
    id: 'daily-summary',
    name: 'Daily Summary Report',
    description: 'Generates a daily summary email: new leads, jobs completed, payments received, outstanding invoices total. Sent to admin users.',
    schedule: '0 18 * * 1-5',
    scheduleHuman: 'Weekdays at 18:00',
    category: 'notifications',
    status: 'paused',
    lastRun: null,
    lastResult: null,
    nextRun: 'Paused',
    endpoint: '/api/cron/daily-summary',
    timeout: 120,
  },
];

const CATEGORY_STYLES: Record<CronCategory, { label: string; class: string }> = {
  monitoring: { label: 'Monitoring', class: 'bg-blue-900/30 text-blue-400' },
  data_sync: { label: 'Data Sync', class: 'bg-purple-900/30 text-purple-400' },
  notifications: { label: 'Notifications', class: 'bg-amber-900/30 text-amber-400' },
  maintenance: { label: 'Maintenance', class: 'bg-slate-700/30 text-slate-400' },
};

const STATUS_ICONS: Record<CronStatus, React.ReactNode> = {
  active: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  paused: <Pause className="h-4 w-4 text-amber-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
};

export default function CronJobsPage() {
  const tCommon = useTranslations('common');
  const [jobs, setJobs] = useState(CRON_JOBS);
  const [filter, setFilter] = useState<CronCategory | 'all'>('all');
  const [runningId, setRunningId] = useState<string | null>(null);

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.category === filter);

  function toggleStatus(id: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: j.status === 'active' ? 'paused' as CronStatus : 'active' as CronStatus, nextRun: j.status === 'active' ? 'Paused' : 'Pending setup' }
          : j
      )
    );
  }

  function triggerRun(id: string) {
    setRunningId(id);
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? { ...j, lastRun: new Date().toLocaleString('nl-NL'), lastResult: 'success' as const }
            : j
        )
      );
      setRunningId(null);
    }, 2000);
  }

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const pausedCount = jobs.filter((j) => j.status === 'paused').length;
  const errorCount = jobs.filter((j) => j.status === 'error').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">Cron Jobs</h1>
            <ScreenBadge code="SY15" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">
            Scheduled tasks for system monitoring, data synchronisation, and automated notifications.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-[#6b6b80]">Active</span>
          </div>
          <p className="mt-2 text-2xl font-medium text-white">{activeCount}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <Pause className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-[#6b6b80]">Paused</span>
          </div>
          <p className="mt-2 text-2xl font-medium text-white">{pausedCount}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-[#6b6b80]">Errors</span>
          </div>
          <p className="mt-2 text-2xl font-medium text-white">{errorCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'monitoring', 'data_sync', 'notifications', 'maintenance'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-[#E8364E] text-white'
                : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_STYLES[cat].label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map((job) => (
          <div key={job.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {STATUS_ICONS[job.status]}
                  <h3 className="text-sm font-medium text-white">{job.name}</h3>
                  <span className={`rounded-md px-2 py-0.5 text-xs ${CATEGORY_STYLES[job.category].class}`}>
                    {CATEGORY_STYLES[job.category].label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#6b6b80] leading-relaxed">{job.description}</p>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <span className="text-[#6b6b80]">
                    <span className="text-white">Schedule:</span> {job.scheduleHuman}
                    <span className="ml-1 font-mono text-[#3a3a50]">({job.schedule})</span>
                  </span>
                  <span className="text-[#6b6b80]">
                    <span className="text-white">Endpoint:</span>{' '}
                    <span className="font-mono">{job.endpoint}</span>
                  </span>
                  <span className="text-[#6b6b80]">
                    <span className="text-white">Timeout:</span> {job.timeout}s
                  </span>
                  {job.lastRun && (
                    <span className="text-[#6b6b80]">
                      <span className="text-white">Last run:</span> {job.lastRun}
                      {job.lastResult === 'success' && <CheckCircle2 className="ml-1 inline h-3 w-3 text-emerald-400" />}
                      {job.lastResult === 'error' && <XCircle className="ml-1 inline h-3 w-3 text-red-400" />}
                    </span>
                  )}
                  <span className="text-[#6b6b80]">
                    <span className="text-white">Next run:</span> {job.nextRun}
                  </span>
                </div>
              </div>

              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => triggerRun(job.id)}
                  disabled={runningId === job.id}
                  className="rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] p-2 text-[#6b6b80] transition-colors hover:text-white disabled:opacity-50"
                  title="Run now"
                >
                  {runningId === job.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleStatus(job.id)}
                  className={`rounded-[10px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    job.status === 'active'
                      ? 'border-amber-900/30 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40'
                      : 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                  }`}
                >
                  {job.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setup notice */}
      <div className="rounded-[10px] border border-amber-900/30 bg-amber-950/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-400">Setup Required</p>
            <p className="mt-1 text-xs text-[#6b6b80]">
              Cron jobs require a Vercel Cron configuration or an external scheduler (e.g., cron-job.org) to trigger the API endpoints.
              Add a <span className="font-mono">vercel.json</span> with cron definitions, or configure an external service to call the endpoints
              with the <span className="font-mono">CRON_SECRET</span> header for authentication. Each endpoint validates the secret before executing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
