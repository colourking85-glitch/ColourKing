/**
 * Pure candidate selection — no I/O. Each evaluator takes already-loaded rows,
 * today's date (YYYY-MM-DD, Europe/Amsterdam) and the reminder settings and
 * returns the reminders that are due today. Idempotency is applied later
 * against reminder_log.
 */

import type { ReminderSettings } from '@/modules/email/schema';
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

export function validLocale(locale: string | null | undefined): EmailLocale {
  return locale === 'en' || locale === 'tr' ? locale : 'nl';
}

/** YYYY-MM-DD + n days, DST-safe (works at UTC noon). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Today in Europe/Amsterdam as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function pickCustomer(c: CustomerRef | CustomerRef[]): CustomerRef {
  return Array.isArray(c) ? c[0] ?? null : c;
}

function customerBlocked(c: CustomerRef): boolean {
  return !!c?.status && BLOCKED_CUSTOMER.has(c.status);
}

export function evaluateInvoices(rows: InvoiceRow[], today: string, cfg: ReminderSettings, appUrl: string, iban: string): Candidate[] {
  const out: Candidate[] = [];
  for (const inv of rows) {
    if (!inv.due_date) continue;
    const customer = pickCustomer(inv.customers);
    if (customerBlocked(customer)) continue;
    const locale = validLocale(customer?.locale ?? inv.locale);
    const base = {
      customerName: customer?.name ?? '',
      invoiceNumber: inv.invoice_number ?? inv.id.slice(0, 8),
      dueDate: inv.due_date,
      totalCents: inv.total_cents,
      payUrl: inv.payment_token ? `${appUrl}/s/${inv.payment_token}` : null,
      iban,
    };

    if (cfg.invoice_due_soon.enabled && inv.status === 'sent' && inv.due_date === addDays(today, cfg.invoice_due_soon.days_before)) {
      out.push({
        kind: 'invoice_due_soon', entityType: 'invoice', entityId: inv.id,
        stage: `T-${cfg.invoice_due_soon.days_before}`,
        recipient: customer?.email ?? null, locale, sender: cfg.invoice_due_soon.sender, data: base,
      });
    }

    if (cfg.invoice_overdue.enabled && (inv.status === 'sent' || inv.status === 'overdue')) {
      const overdueDays = daysBetween(inv.due_date, today);
      if (overdueDays === cfg.invoice_overdue.days_after) {
        out.push({
          kind: 'invoice_overdue', entityType: 'invoice', entityId: inv.id,
          stage: `overdue-${cfg.invoice_overdue.days_after}`,
          recipient: customer?.email ?? null, locale, sender: cfg.invoice_overdue.sender,
          data: { ...base, daysOverdue: overdueDays },
        });
      }
    }
  }
  return out;
}

export function evaluateOffers(rows: OfferRow[], today: string, cfg: ReminderSettings, appUrl: string): Candidate[] {
  if (!cfg.offer_expiring.enabled) return [];
  const target = addDays(today, cfg.offer_expiring.days_before);
  const out: Candidate[] = [];
  for (const offer of rows) {
    if (offer.status !== 'sent' || offer.valid_until !== target) continue;
    const customer = pickCustomer(offer.customers);
    if (customerBlocked(customer)) continue;
    const offerNumber = offer.offer_number ?? offer.id.slice(0, 8);
    out.push({
      kind: 'offer_expiring', entityType: 'offer', entityId: offer.id,
      stage: `T-${cfg.offer_expiring.days_before}`,
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
  return out;
}

export function evaluateAppointments(rows: AppointmentRow[], today: string, cfg: ReminderSettings, appUrl: string, address: string): Candidate[] {
  if (!cfg.appointment_reminder.enabled) return [];
  const target = addDays(today, cfg.appointment_reminder.days_before);
  const out: Candidate[] = [];
  for (const apt of rows) {
    if (apt.status !== 'confirmed' || apt.scheduled_date !== target) continue;
    const customer = pickCustomer(apt.customers);
    if (customerBlocked(customer)) continue;
    const vehicle = Array.isArray(apt.vehicles) ? apt.vehicles[0] : apt.vehicles;
    out.push({
      kind: 'appointment_reminder', entityType: 'appointment', entityId: apt.id,
      stage: `T-${cfg.appointment_reminder.days_before}`,
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
