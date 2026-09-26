import { admin } from '@/lib/supabase/admin';
import { getCompanyInfo } from '@/lib/company';
import { getSender } from '@/lib/email-identity';
import { sendEmail } from '@/modules/email/sender';
import { renderTemplate, getSubject } from '@/modules/email/templates';
import { logEmail } from '@/modules/email/log';
import { sendVehicleReady } from '@/modules/email/triggers';
import { normalizeReminderSettings, type ReminderSettings, type EmailTemplateName, type TemplateDataMap } from '@/modules/email/schema';
import { evaluateInvoices, evaluateOffers, evaluateAppointments, evaluateJobs, localToday, type InvoiceRow, type OfferRow, type AppointmentRow, type JobRow } from './evaluators';
import type { Candidate, CandidateResult, ReminderKind, RunReport } from './schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://colourking.nl';

const TEMPLATE_FOR: Record<Exclude<ReminderKind, 'vehicle_ready'>, EmailTemplateName> = {
  invoice_due_soon: 'invoiceDueSoon',
  invoice_overdue: 'invoiceOverdue',
  offer_expiring: 'offerExpiring',
  appointment_reminder: 'appointmentReminder',
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const { data } = await admin.from('settings').select('value').eq('key', 'reminders').single();
  return normalizeReminderSettings(data?.value);
}

type RunOptions = {
  dryRun?: boolean;
  kinds?: ReminderKind[];
  now?: Date;
  sentBy?: string | null;
};

export async function runReminders(opts: RunOptions = {}): Promise<RunReport> {
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const today = localToday(now);
  const dryRun = !!opts.dryRun;
  const report: RunReport = { ok: true, dryRun, today, evaluated: 0, sent: 0, skipped: 0, failed: 0, markedOverdue: 0, results: [] };

  try {
    const cfg = await getReminderSettings();
    const company = await getCompanyInfo();
    const wanted = new Set<ReminderKind>(opts.kinds ?? ['invoice_due_soon', 'invoice_overdue', 'offer_expiring', 'appointment_reminder', 'vehicle_ready']);
    const candidates: Candidate[] = [];

    if (wanted.has('invoice_due_soon') || wanted.has('invoice_overdue')) {
      if (cfg.invoice_overdue.auto_mark_overdue && !dryRun) {
        const { data: marked } = await admin
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('status', 'sent')
          .lt('due_date', today)
          .select('id');
        report.markedOverdue = marked?.length ?? 0;
      }
      const { data: invoices } = await admin
        .from('invoices')
        .select('id, invoice_number, status, due_date, total_cents, payment_token, locale, customers(name, email, locale, status)')
        .in('status', ['sent', 'overdue']);
      const all = evaluateInvoices((invoices ?? []) as unknown as InvoiceRow[], nowMs, cfg, APP_URL, company.iban);
      candidates.push(...all.filter((c) => wanted.has(c.kind)));
    }

    if (wanted.has('offer_expiring')) {
      const { data: offers } = await admin
        .from('offers')
        .select('id, offer_number, status, valid_until, total_cents, locale, customers(name, email, locale, status)')
        .eq('status', 'sent');
      candidates.push(...evaluateOffers((offers ?? []) as unknown as OfferRow[], nowMs, cfg, APP_URL));
    }

    if (wanted.has('appointment_reminder')) {
      const { data: apts } = await admin
        .from('appointments')
        .select('id, status, type, scheduled_date, scheduled_time, contact_name, contact_email, customers(name, email, locale, status), vehicles(kenteken, make, model)')
        .eq('status', 'confirmed')
        .gte('scheduled_date', today);
      const address = `${company.address}, ${company.postcode} ${company.city}`;
      candidates.push(...evaluateAppointments((apts ?? []) as unknown as AppointmentRow[], nowMs, cfg, APP_URL, address));
    }

    if (wanted.has('vehicle_ready')) {
      const { data: jobs } = await admin
        .from('jobs')
        .select('id, number, stage, customers(name, email, locale, status)')
        .eq('stage', 'ready');
      candidates.push(...evaluateJobs((jobs ?? []) as unknown as JobRow[], cfg));
    }

    report.evaluated = candidates.length;

    // Idempotency: drop anything already logged for (kind, entity, stage)
    const ids = Array.from(new Set(candidates.map((c) => c.entityId)));
    const { data: existing } = ids.length
      ? await admin.from('reminder_log').select('kind, entity_id, stage').in('entity_id', ids)
      : { data: [] as Array<{ kind: string; entity_id: string; stage: string }> };
    const seen = new Set((existing ?? []).map((r) => `${r.kind}|${r.entity_id}|${r.stage}`));
    const fresh = candidates.filter((c) => !seen.has(`${c.kind}|${c.entityId}|${c.stage}`)).slice(0, cfg.max_per_run);

    for (const c of fresh) {
      const result = await processCandidate(c, dryRun, company);
      report.results.push(result);
      report[result.status] += 1;

      if (!dryRun) {
        const { error } = await admin.from('reminder_log').insert({
          kind: c.kind,
          entity_type: c.entityType,
          entity_id: c.entityId,
          stage: c.stage,
          recipient: c.recipient ?? '',
          locale: c.locale,
          status: result.status,
          message_id: result.messageId ?? null,
          error: result.error ?? null,
          sent_by: opts.sentBy ?? null,
        });
        if (error) console.error('[REMINDERS] log insert failed:', error.message);
      }
    }

    if (!dryRun && (report.sent || report.failed)) {
      await admin.from('notifications').insert({
        type: 'system',
        title: `Herinneringen verzonden: ${report.sent}${report.failed ? `, ${report.failed} mislukt` : ''}`,
        body: `Run ${today}: ${report.evaluated} beoordeeld, ${report.sent} verzonden, ${report.skipped} overgeslagen, ${report.failed} mislukt, ${report.markedOverdue} facturen op vervallen gezet.`,
        link: '/app/instellingen/herinneringen',
        ref_type: 'reminder_run',
        ref_id: null,
        staff_id: null,
      });
    }
  } catch (err) {
    report.ok = false;
    report.error = err instanceof Error ? err.message : String(err);
  }

  if (!dryRun) {
    await admin.from('settings').upsert({
      key: 'reminders_state',
      value: {
        last_run_at: now.toISOString(),
        trigger: opts.sentBy ? 'admin' : 'cron',
        ok: report.ok,
        evaluated: report.evaluated,
        sent: report.sent,
        skipped: report.skipped,
        failed: report.failed,
        marked_overdue: report.markedOverdue,
        error: report.error ?? null,
      },
    }, { onConflict: 'key' });
  }

  return report;
}

async function processCandidate(
  c: Candidate,
  dryRun: boolean,
  company: Awaited<ReturnType<typeof getCompanyInfo>>,
): Promise<CandidateResult> {
  if (!c.recipient) return { ...c, status: 'skipped', error: 'no_email' };
  if (dryRun) return { ...c, status: 'sent', messageId: 'dry-run' };

  if (c.kind === 'vehicle_ready') {
    const r = await sendVehicleReady(c.entityId);
    return { ...c, status: r.success ? 'sent' : 'failed', messageId: r.messageId ?? null, error: r.error ?? null };
  }

  const template = TEMPLATE_FOR[c.kind];
  const data = c.data as TemplateDataMap[typeof template];
  const html = renderTemplate(template, data, c.locale, company);
  const ref = (c.data.invoiceNumber ?? c.data.offerNumber) as string | undefined;
  const subject = ref ? `${getSubject(template, data, c.locale)} [${ref}]` : getSubject(template, data, c.locale);
  const sender = await getSender(c.sender);
  const result = await sendEmail(c.recipient, subject, html, sender);

  await logEmail({
    to: c.recipient,
    subject,
    template,
    locale: c.locale,
    ref_type: c.entityType,
    ref_id: c.entityId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return { ...c, status: result.success ? 'sent' : 'failed', messageId: result.messageId ?? null, error: result.error ?? null };
}
