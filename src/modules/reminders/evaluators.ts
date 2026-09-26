/**
 * Pure candidate selection — no I/O. Each reminder rule has up to two
 * "moments" (e.g. 24 hours and 2 hours before an appointment, 2 days after an
 * invoice due date). A moment is due once `now` has passed event ± offset; the
 * caller drops moments already in reminder_log, so the job can run every
 * 15 minutes and still send each moment exactly once. Missed runs are caught
 * up within GRACE_MS; older moments are skipped silently.
 */

import type { ReminderSettings, ReminderMoment } from '@/modules/email/schema';
import type { EmailLocale } from '@/modules/email/schema';
import type { Candidate } from './schema';

type CustomerRef = { name?: string | null; email?: string | null; locale?: string | null; status?: string | null } | null;

export type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string;
  due_date: string | null;
  total_cents: number;
  payment_token: string | null;
  locale: string | null;
  customers: CustomerRef;
};

export type OfferRow = {
  id: string;
  offer_number: string | null;
  status: string;
  valid_until: string | null;
  total_cents: number;
  locale: string | null;
  customers: CustomerRef;
};

export type AppointmentRow = {
  id: string;
  status: string;
  type: string;
  scheduled_date: string;
  scheduled_time: string;
  contact_name: string | null;
  contact_email: string | null;
  customers: CustomerRef;
  vehicles: { kenteken?: string | null; make?: string | null; model?: string | null } | null;
};

export type JobRow = {
  id: string;
  number: number | null;
  stage: string;
  customers: CustomerRef;
};

const BLOCKED_CUSTOMER = new Set(['blocked', 'archived']);
const HOUR = 3_600_000;
/** A moment older than this is not caught up (e.g. reminders switched on months late). */
export const GRACE_MS = 48 * HOUR;
/** Date-only events (invoice due, offer expiry) count from this local hour. */
const DATE_EVENT_HOUR = 9;

export function validLocale(locale: string | null | undefined): EmailLocale {
  return locale === 'en' || locale === 'tr' ? locale : 'nl';
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Today in Europe/Amsterdam as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Europe/Amsterdam wall-clock (YYYY-MM-DD, HH:MM[:SS]) → epoch ms. DST-safe. */
export function amsterdamToUtc(date: string, time = '00:00'): number {
  const [h, m] = time.split(':').map(Number);
  const guess = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), h, m || 0);
  const offsetAt = (ms: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Amsterdam', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(ms));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
    return asUtc - ms;
  };
  return guess - offsetAt(guess - offsetAt(guess));
}

export function momentMs(m: ReminderMoment): number {
  return m.value * (m.unit === 'hours' ? HOUR : 24 * HOUR);
}

export function momentStage(m: ReminderMoment, direction: 'before' | 'after'): string {
  return `${direction === 'before' ? 'T-' : '+'}${m.value}${m.unit === 'hours' ? 'h' : 'd'}`;
}

/** Moments whose send time has arrived (and is not stale). For "before" the event itself must still be in the future. */
export function dueMoments(
  eventMs: number,
  moments: ReminderMoment[],
  direction: 'before' | 'after',
  nowMs: number,
): ReminderMoment[] {
  return moments.filter((m) => {
    const sendAt = direction === 'before' ? eventMs - momentMs(m) : eventMs + momentMs(m);
    if (nowMs < sendAt) return false;
    if (nowMs - sendAt > GRACE_MS) return false;
    if (direction === 'before' && nowMs >= eventMs) return false;
    return true;
  });
}

function pickCustomer(c: CustomerRef | CustomerRef[]): CustomerRef {
  return Array.isArray(c) ? c[0] ?? null : c;
}

function customerBlocked(c: CustomerRef): boolean {
  return !!c?.status && BLOCKED_CUSTOMER.has(c.status);
}

export function evaluateInvoices(rows: InvoiceRow[], nowMs: number, cfg: ReminderSettings, appUrl: string, iban: string): Candidate[] {
  const out: Candidate[] = [];
  const today = localToday(new Date(nowMs));
  for (const inv of rows) {
    if (!inv.due_date) continue;
    const customer = pickCustomer(inv.customers);
    if (customerBlocked(customer)) continue;
    const locale = validLocale(customer?.locale ?? inv.locale);
    const dueMs = amsterdamToUtc(inv.due_date, `${String(DATE_EVENT_HOUR).padStart(2, '0')}:00`);
    const base = {
      customerName: customer?.name ?? '',
      invoiceNumber: inv.invoice_number ?? inv.id.slice(0, 8),
      dueDate: inv.due_date,
      totalCents: inv.total_cents,
      payUrl: inv.payment_token ? `${appUrl}/s/${inv.payment_token}` : null,
      iban,
    };

    if (cfg.invoice_due_soon.enabled && inv.status === 'sent') {
      for (const m of dueMoments(dueMs, cfg.invoice_due_soon.moments, 'before', nowMs)) {
        out.push({
          kind: 'invoice_due_soon', entityType: 'invoice', entityId: inv.id, stage: momentStage(m, 'before'),
          recipient: customer?.email ?? null, locale, sender: cfg.invoice_due_soon.sender, data: base,
        });
      }
    }

    if (cfg.invoice_overdue.enabled && (inv.status === 'sent' || inv.status === 'overdue')) {
      for (const m of dueMoments(dueMs, cfg.invoice_overdue.moments, 'after', nowMs)) {
        const daysOverdue = Math.max(1, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${inv.due_date}T12:00:00Z`)) / 86_400_000));
        out.push({
          kind: 'invoice_overdue', entityType: 'invoice', entityId: inv.id, stage: momentStage(m, 'after'),
          recipient: customer?.email ?? null, locale, sender: cfg.invoice_overdue.sender,
          data: { ...base, daysOverdue },
        });
      }
    }
  }
  return out;
}

export function evaluateOffers(rows: OfferRow[], nowMs: number, cfg: ReminderSettings, appUrl: string): Candidate[] {
  if (!cfg.offer_expiring.enabled) return [];
  const out: Candidate[] = [];
  for (const offer of rows) {
    if (offer.status !== 'sent' || !offer.valid_until) continue;
    const customer = pickCustomer(offer.customers);
    if (customerBlocked(customer)) continue;
    const expiresMs = amsterdamToUtc(offer.valid_until, `${String(DATE_EVENT_HOUR).padStart(2, '0')}:00`);
    const offerNumber = offer.offer_number ?? offer.id.slice(0, 8);
    for (const m of dueMoments(expiresMs, cfg.offer_expiring.moments, 'before', nowMs)) {
      out.push({
        kind: 'offer_expiring', entityType: 'offer', entityId: offer.id, stage: momentStage(m, 'before'),
        recipient: customer?.email ?? null,
        locale: validLocale(customer?.locale ?? offer.locale),
        sender: cfg.offer_expiring.sender,
        data: {
          customerName: customer?.name ?? '',
          offerNumber,
          validUntil: offer.valid_until,
          totalCents: offer.total_cents,
          contactUrl: `${appUrl}/contact?ref=${encodeURIComponent(offerNumber)}`,
        },
      });
    }
  }
  return out;
}

export function evaluateAppointments(rows: AppointmentRow[], nowMs: number, cfg: ReminderSettings, appUrl: string, address: string): Candidate[] {
  if (!cfg.appointment_reminder.enabled) return [];
  const out: Candidate[] = [];
  for (const apt of rows) {
    if (apt.status !== 'confirmed') continue;
    const customer = pickCustomer(apt.customers);
    if (customerBlocked(customer)) continue;
    const startMs = amsterdamToUtc(apt.scheduled_date, String(apt.scheduled_time).slice(0, 5));
    const vehicle = Array.isArray(apt.vehicles) ? apt.vehicles[0] : apt.vehicles;
    for (const m of dueMoments(startMs, cfg.appointment_reminder.moments, 'before', nowMs)) {
      out.push({
        kind: 'appointment_reminder', entityType: 'appointment', entityId: apt.id, stage: momentStage(m, 'before'),
        recipient: apt.contact_email ?? customer?.email ?? null,
        locale: validLocale(customer?.locale),
        sender: cfg.appointment_reminder.sender,
        data: {
          customerName: apt.contact_name ?? customer?.name ?? '',
          appointmentType: apt.type,
          scheduledDate: apt.scheduled_date,
          scheduledTime: String(apt.scheduled_time).slice(0, 5),
          address,
          vehicleInfo: vehicle ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim() : null,
          cancelUrl: `${appUrl}/contact?ref=AP-${apt.id.slice(0, 8)}&action=cancel`,
        },
      });
    }
  }
  return out;
}

/** Jobs sitting in `ready` — the actual email is rendered by sendVehicleReady(). */
export function evaluateJobs(rows: JobRow[], cfg: ReminderSettings): Candidate[] {
  if (!cfg.vehicle_ready.enabled) return [];
  return rows
    .filter((j) => j.stage === 'ready' && !customerBlocked(pickCustomer(j.customers)))
    .map((j) => {
      const customer = pickCustomer(j.customers);
      return {
        kind: 'vehicle_ready' as const, entityType: 'job' as const, entityId: j.id, stage: 'ready',
        recipient: customer?.email ?? null,
        locale: validLocale(customer?.locale),
        sender: cfg.vehicle_ready.sender,
        data: {},
      };
    });
}
