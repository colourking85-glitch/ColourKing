'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { RefreshCw, Play, FlaskConical } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Row = {
  id: string;
  kind: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  entity_href: string;
  stage: string;
  recipient: string;
  locale: string;
  status: 'sent' | 'skipped' | 'failed';
  error: string | null;
  sent_by: string | null;
  created_at: string;
};

const KINDS = ['invoice_due_soon', 'invoice_overdue', 'offer_expiring', 'appointment_reminder', 'vehicle_ready'] as const;

const STATUS_CLASS: Record<Row['status'], string> = {
  sent: 'bg-green-500/10 text-green-400',
  skipped: 'bg-amber-500/10 text-amber-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function ReminderLogPage() {
  const tSy = useTranslations('sy');
  const tCommon = useTranslations('common');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState<'dry' | 'live' | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ limit: '200' });
    if (kind) q.set('kind', kind);
    if (status) q.set('status', status);
    const res = await fetch(`/api/reminders?${q}`);
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }, [kind, status]);

  useEffect(() => { load(); }, [load]);

  const KIND_LABEL: Record<string, string> = {
    invoice_due_soon: tSy('remInvoiceDueSoon'),
    invoice_overdue: tSy('remInvoiceOverdue'),
    offer_expiring: tSy('remOfferExpiring'),
    appointment_reminder: tSy('remAppointment'),
    vehicle_ready: tSy('remVehicleReady'),
  };
  const STATUS_LABEL: Record<Row['status'], string> = {
    sent: tSy('statusSent'),
    skipped: tSy('statusSkipped'),
    failed: tSy('statusFailed'),
  };

  async function run(dry: boolean) {
    setRunning(dry ? 'dry' : 'live');
    setRunMsg(null);
    const res = await fetch(`/api/cron/reminders${dry ? '?dry=1' : ''}`, { method: 'POST' });
    const r = await res.json().catch(() => ({ ok: false }));
    if (!r.ok) setRunMsg(r.error ?? res.statusText);
    else if (dry) setRunMsg(tSy('dryRunResult', { count: r.sent }));
    else setRunMsg(tSy('runResult', { sent: r.sent, skipped: r.skipped, failed: r.failed }));
    setRunning(null);
    if (!dry) load();
  }

  const selectClass = 'rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-sm text-white focus:border-ck-red focus:outline-none';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY60" />
        <h1 className="font-display text-2xl font-bold text-white">{tSy('remindersLog')}</h1>
      </div>
      <p className="text-sm text-ck-muted">
        {tSy('remindersLogDesc')} <Link href="/app/instellingen" className="underline hover:text-white">{tSy('emailTab')} →</Link>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
          <option value="">{tSy('allKinds')}</option>
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">{tSy('allStatuses')}</option>
          {(['sent', 'skipped', 'failed'] as const).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button onClick={load} className="rounded-lg border border-ck-dark-border p-2 text-ck-muted hover:text-white" title={tSy('refresh')}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => run(true)} disabled={running !== null} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:text-white disabled:opacity-50">
            <FlaskConical size={12} /> {tSy('dryRun')}
          </button>
          <button onClick={() => run(false)} disabled={running !== null} className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 disabled:opacity-50">
            <Play size={12} /> {tSy('runNow')}
          </button>
        </div>
      </div>
      {runMsg && <p className="text-xs text-ck-muted-light">{runMsg}</p>}

      <div className="overflow-x-auto rounded-lg border border-ck-dark-border bg-ck-dark-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border text-left text-[10px] font-semibold uppercase tracking-wider text-ck-muted">
              <th className="px-4 py-2">{tSy('logDate')}</th>
              <th className="px-4 py-2">{tSy('logKind')}</th>
              <th className="px-4 py-2">{tSy('logEntity')}</th>
              <th className="px-4 py-2">{tSy('logRecipient')}</th>
              <th className="px-4 py-2">{tSy('logStage')}</th>
              <th className="px-4 py-2">{tSy('logStatus')}</th>
              <th className="px-4 py-2">{tSy('logError')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ck-dark-border">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">{tCommon('loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">{tSy('logEmpty')}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-2 text-ck-muted-light">{new Date(r.created_at).toLocaleString('nl-NL')}</td>
                <td className="px-4 py-2 text-white">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td className="px-4 py-2"><Link href={r.entity_href} className="font-mono text-xs text-ck-red hover:underline">{r.entity_label}</Link></td>
                <td className="px-4 py-2 text-ck-muted-light">{r.recipient || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-ck-muted">{r.stage}</td>
                <td className="px-4 py-2"><span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                <td className="px-4 py-2 text-xs text-red-400">{r.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
