'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, BellRing, Send, Play, FlaskConical, Check, Settings } from 'lucide-react';
import { EMAIL_PURPOSES, type EmailPurpose, type EmailIdentities } from '@/lib/email-identity';
import type { ReminderSettings } from '@/modules/email/schema';

type RunReport = { ok: boolean; dryRun: boolean; evaluated: number; sent: number; skipped: number; failed: number; error?: string };

const inputClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';
const numClass = 'w-20 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-sm text-white focus:border-ck-red focus:outline-none';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-ck-red' : 'bg-ck-dark-border'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function EmailSettingsTab() {
  const tSy = useTranslations('sy');
  const tCommon = useTranslations('common');

  const [identities, setIdentities] = useState<EmailIdentities | null>(null);
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<EmailPurpose | null>(null);
  const [testMsg, setTestMsg] = useState<{ purpose: EmailPurpose; ok: boolean; text: string } | null>(null);
  const [running, setRunning] = useState<'dry' | 'live' | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/settings/email');
    if (res.ok) {
      const data = await res.json();
      setIdentities(data.identities);
      setReminders(data.reminders);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!identities || !reminders) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/settings/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identities, reminders }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Error');
    }
    setSaving(false);
  }

  async function sendTest(purpose: EmailPurpose) {
    const to = window.prompt(tSy('sendTestPrompt'));
    if (!to) return;
    setTesting(purpose);
    setTestMsg(null);
    const res = await fetch('/api/settings/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, to }),
    });
    const body = await res.json().catch(() => ({}));
    setTestMsg(
      res.ok
        ? { purpose, ok: true, text: tSy('testSent', { from: body.from ?? '' }) }
        : { purpose, ok: false, text: tSy('testFailed', { error: body.error ?? res.statusText }) },
    );
    setTesting(null);
  }

  async function run(dry: boolean) {
    setRunning(dry ? 'dry' : 'live');
    setRunMsg(null);
    const res = await fetch(`/api/cron/reminders${dry ? '?dry=1' : ''}`, { method: 'POST' });
    const r: RunReport = await res.json().catch(() => ({ ok: false, dryRun: dry, evaluated: 0, sent: 0, skipped: 0, failed: 0 }));
    if (!r.ok) setRunMsg(r.error ?? res.statusText);
    else if (dry) setRunMsg(tSy('dryRunResult', { count: r.sent }));
    else setRunMsg(tSy('runResult', { sent: r.sent, skipped: r.skipped, failed: r.failed }));
    setRunning(null);
  }

  if (!identities || !reminders) {
    return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  }

  const PURPOSE_LABEL: Record<EmailPurpose, string> = {
    default: tSy('purposeDefault'),
    offers: tSy('purposeOffers'),
    invoices: tSy('purposeInvoices'),
    appointments: tSy('purposeAppointments'),
    workshop: tSy('purposeWorkshop'),
    leads: tSy('purposeLeads'),
  };

  function setIdentity(p: EmailPurpose, patch: Partial<EmailIdentities[EmailPurpose]>) {
    setIdentities((prev) => prev ? { ...prev, [p]: { ...prev[p], ...patch } } : prev);
  }

  function setRem<K extends keyof ReminderSettings>(k: K, patch: Partial<ReminderSettings[K]>) {
    setReminders((prev) => prev ? { ...prev, [k]: { ...(prev[k] as object), ...patch } } : prev);
  }

  const senderSelect = (value: EmailPurpose, onChange: (v: EmailPurpose) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value as EmailPurpose)} className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-sm text-white focus:border-ck-red focus:outline-none">
      {EMAIL_PURPOSES.map((p) => (
        <option key={p} value={p}>{PURPOSE_LABEL[p]} — {identities[p].from_email || '—'}</option>
      ))}
    </select>
  );

  return (
    <>
      {/* Sender identities */}
      <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <Mail size={16} /> {tSy('emailSenders')}
        </h2>
        <p className="mb-4 text-xs text-ck-muted">{tSy('emailSendersDesc')}</p>

        <div className="grid gap-3 md:grid-cols-2">
          {EMAIL_PURPOSES.map((p) => {
            const id = identities[p];
            return (
              <div key={p} className={`rounded-lg border p-4 ${id.enabled ? 'border-ck-dark-border' : 'border-ck-dark-border/50 opacity-60'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{PURPOSE_LABEL[p]}</span>
                  {p !== 'default' && <Toggle on={id.enabled} onChange={(v) => setIdentity(p, { enabled: v })} />}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('fromName')}</label>
                    <input className={inputClass} value={id.from_name} onChange={(e) => setIdentity(p, { from_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('fromEmail')}</label>
                    <input className={inputClass} type="email" value={id.from_email} onChange={(e) => setIdentity(p, { from_email: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('replyTo')}</label>
                    <input className={inputClass} type="email" value={id.reply_to} onChange={(e) => setIdentity(p, { reply_to: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ck-muted">{tSy('bcc')}</label>
                    <input className={inputClass} type="email" placeholder="archief@colourking.nl" value={id.bcc ?? ''} onChange={(e) => setIdentity(p, { bcc: e.target.value })} />
                    <p className="mt-1 text-[11px] text-ck-muted">{tSy('bccHint')}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => sendTest(p)}
                    disabled={testing === p}
                    className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:border-ck-muted/50 hover:text-white disabled:opacity-50"
                  >
                    <Send size={12} /> {testing === p ? tSy('saving') : tSy('sendTest')}
                  </button>
                  {testMsg?.purpose === p && (
                    <span className={`text-xs ${testMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{testMsg.text}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reminder rules */}
      <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <BellRing size={16} /> {tSy('remindersSection')}
        </h2>
        <p className="mb-4 text-xs text-ck-muted">{tSy('remindersDesc')}</p>

        <div className="divide-y divide-ck-dark-border">
          <div className="flex flex-wrap items-center gap-3 py-3">
            <Toggle on={reminders.invoice_due_soon.enabled} onChange={(v) => setRem('invoice_due_soon', { enabled: v })} />
            <span className="w-64 text-sm text-white">{tSy('remInvoiceDueSoon')}</span>
            <input type="number" min={0} max={60} className={numClass} value={reminders.invoice_due_soon.days_before} onChange={(e) => setRem('invoice_due_soon', { days_before: Number(e.target.value) })} />
            <span className="text-xs text-ck-muted">{tSy('daysBefore')}</span>
            {senderSelect(reminders.invoice_due_soon.sender, (v) => setRem('invoice_due_soon', { sender: v }))}
          </div>

          <div className="flex flex-wrap items-center gap-3 py-3">
            <Toggle on={reminders.invoice_overdue.enabled} onChange={(v) => setRem('invoice_overdue', { enabled: v })} />
            <span className="w-64 text-sm text-white">{tSy('remInvoiceOverdue')}</span>
            <input type="number" min={0} max={60} className={numClass} value={reminders.invoice_overdue.days_after} onChange={(e) => setRem('invoice_overdue', { days_after: Number(e.target.value) })} />
            <span className="text-xs text-ck-muted">{tSy('daysAfter')}</span>
            {senderSelect(reminders.invoice_overdue.sender, (v) => setRem('invoice_overdue', { sender: v }))}
            <label className="ml-auto flex items-center gap-2 text-xs text-ck-muted-light">
              <input type="checkbox" checked={reminders.invoice_overdue.auto_mark_overdue} onChange={(e) => setRem('invoice_overdue', { auto_mark_overdue: e.target.checked })} />
              {tSy('autoMarkOverdue')}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 py-3">
            <Toggle on={reminders.offer_expiring.enabled} onChange={(v) => setRem('offer_expiring', { enabled: v })} />
            <span className="w-64 text-sm text-white">{tSy('remOfferExpiring')}</span>
            <input type="number" min={0} max={60} className={numClass} value={reminders.offer_expiring.days_before} onChange={(e) => setRem('offer_expiring', { days_before: Number(e.target.value) })} />
            <span className="text-xs text-ck-muted">{tSy('daysBefore')}</span>
            {senderSelect(reminders.offer_expiring.sender, (v) => setRem('offer_expiring', { sender: v }))}
          </div>

          <div className="flex flex-wrap items-center gap-3 py-3">
            <Toggle on={reminders.appointment_reminder.enabled} onChange={(v) => setRem('appointment_reminder', { enabled: v })} />
            <span className="w-64 text-sm text-white">{tSy('remAppointment')}</span>
            <input type="number" min={0} max={60} className={numClass} value={reminders.appointment_reminder.days_before} onChange={(e) => setRem('appointment_reminder', { days_before: Number(e.target.value) })} />
            <span className="text-xs text-ck-muted">{tSy('daysBefore')}</span>
            {senderSelect(reminders.appointment_reminder.sender, (v) => setRem('appointment_reminder', { sender: v }))}
          </div>

          <div className="flex flex-wrap items-center gap-3 py-3">
            <Toggle on={reminders.vehicle_ready.enabled} onChange={(v) => setRem('vehicle_ready', { enabled: v })} />
            <span className="w-64 text-sm text-white">{tSy('remVehicleReady')}</span>
            {senderSelect(reminders.vehicle_ready.sender, (v) => setRem('vehicle_ready', { sender: v }))}
          </div>

          <div className="flex items-center gap-3 py-3">
            <span className="text-xs text-ck-muted">{tSy('maxPerRun')}</span>
            <input type="number" min={1} max={1000} className={numClass} value={reminders.max_per_run} onChange={(e) => setReminders((prev) => prev ? { ...prev, max_per_run: Number(e.target.value) } : prev)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ck-dark-border pt-4">
          <button type="button" onClick={() => run(true)} disabled={running !== null} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:text-white disabled:opacity-50">
            <FlaskConical size={12} /> {tSy('dryRun')}
          </button>
          <button type="button" onClick={() => run(false)} disabled={running !== null} className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 disabled:opacity-50">
            <Play size={12} /> {tSy('runNow')}
          </button>
          <Link href="/app/instellingen/herinneringen" className="text-xs text-ck-muted-light underline hover:text-white">{tSy('viewLog')}</Link>
          {runMsg && <span className="text-xs text-ck-muted-light">{runMsg}</span>}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ck-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50">
          <Settings size={14} /> {saving ? tSy('saving') : tCommon('save')}
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-400"><Check size={14} /> {tSy('saved')}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </>
  );
}
