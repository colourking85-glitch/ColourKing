import { describe, it, expect } from 'vitest';
import { REMINDER_DEFAULTS, normalizeReminderSettings, type ReminderSettings } from '@/modules/email/schema';
import { amsterdamToUtc, dueMoments, momentStage, evaluateInvoices, evaluateOffers, evaluateAppointments, evaluateJobs } from './evaluators';

const H = 3_600_000;
const cfg: ReminderSettings = REMINDER_DEFAULTS;
const cust = { name: 'Jan', email: 'jan@example.com', locale: 'nl', status: 'active' };

describe('amsterdamToUtc', () => {
  it('handles CEST (+2) and CET (+1)', () => {
    expect(new Date(amsterdamToUtc('2026-07-01', '09:00')).toISOString()).toBe('2026-07-01T07:00:00.000Z');
    expect(new Date(amsterdamToUtc('2026-01-15', '09:00')).toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });
});

describe('dueMoments', () => {
  const event = amsterdamToUtc('2026-10-01', '10:00');
  const moments = [{ value: 24, unit: 'hours' as const }, { value: 2, unit: 'hours' as const }];
  it('nothing before the first moment', () => {
    expect(dueMoments(event, moments, 'before', event - 30 * H)).toEqual([]);
  });
  it('24h moment once inside its window, not the 2h one yet', () => {
    expect(dueMoments(event, moments, 'before', event - 23 * H).map((m) => m.value)).toEqual([24]);
  });
  it('both moments due shortly before the event', () => {
    expect(dueMoments(event, moments, 'before', event - 1 * H).map((m) => m.value)).toEqual([24, 2]);
  });
  it('never a "before" reminder once the event has started', () => {
    expect(dueMoments(event, moments, 'before', event + 5 * 60_000)).toEqual([]);
  });
  it('stale moments beyond the grace window are skipped', () => {
    expect(dueMoments(event, [{ value: 10, unit: 'days' }], 'before', event - 5 * 24 * H)).toEqual([]);
  });
  it('after moments', () => {
    expect(dueMoments(event, [{ value: 2, unit: 'days' }], 'after', event + 47 * H)).toEqual([]);
    expect(dueMoments(event, [{ value: 2, unit: 'days' }], 'after', event + 49 * H).length).toBe(1);
  });
  it('stage labels', () => {
    expect(momentStage({ value: 24, unit: 'hours' }, 'before')).toBe('T-24h');
    expect(momentStage({ value: 2, unit: 'days' }, 'after')).toBe('+2d');
  });
});

describe('normalizeReminderSettings', () => {
  it('upgrades legacy days_before/days_after and caps moments at 2', () => {
    const s = normalizeReminderSettings({ appointment_reminder: { enabled: true, days_before: 1, sender: 'appointments' }, invoice_overdue: { enabled: false, days_after: 3, auto_mark_overdue: false, sender: 'invoices' } });
    expect(s.appointment_reminder.moments).toEqual([{ value: 1, unit: 'days' }]);
    expect(s.invoice_overdue.moments).toEqual([{ value: 3, unit: 'days' }]);
    expect(s.invoice_overdue.enabled).toBe(false);
    const three = normalizeReminderSettings({ offer_expiring: { enabled: true, sender: 'offers', moments: [{ value: 1, unit: 'days' }, { value: 2, unit: 'days' }, { value: 3, unit: 'days' }] } });
    expect(three).toEqual(REMINDER_DEFAULTS);
  });
});

describe('invoices', () => {
  const base = { invoice_number: 'FA-1', total_cents: 1000, payment_token: 'tok', locale: 'nl', customers: cust };
  const due = amsterdamToUtc('2026-10-10', '09:00');
  it('due-soon 2 days before, overdue 2 days after', () => {
    const rows = [{ ...base, id: 'a', status: 'sent', due_date: '2026-10-10' }];
    expect(evaluateInvoices(rows, due - 47 * H, cfg, 'https://x', 'NL00').map((c) => c.stage)).toEqual(['T-2d']);
    expect(evaluateInvoices(rows, due - 49 * H, cfg, 'https://x', 'NL00')).toEqual([]);
    const late = evaluateInvoices([{ ...rows[0], status: 'overdue' }], due + 49 * H, cfg, 'https://x', 'NL00');
    expect(late.map((c) => c.stage)).toEqual(['+2d']);
    expect(late[0].data.daysOverdue).toBe(2);
  });
  it('skips blocked customers, keeps null recipient without email', () => {
    const rows = [
      { ...base, id: 'a', status: 'sent', due_date: '2026-10-10', customers: { ...cust, status: 'blocked' } },
      { ...base, id: 'b', status: 'sent', due_date: '2026-10-10', customers: { ...cust, email: null } },
    ];
    const out = evaluateInvoices(rows, due - 47 * H, cfg, 'https://x', 'NL00');
    expect(out).toHaveLength(1);
    expect(out[0].recipient).toBeNull();
  });
});

describe('offers', () => {
  it('sent offers 2 days before expiry', () => {
    const exp = amsterdamToUtc('2026-10-10', '09:00');
    const rows = [
      { id: 'a', offer_number: 'ES-1', status: 'sent', valid_until: '2026-10-10', total_cents: 5, locale: 'en', customers: cust },
      { id: 'b', offer_number: 'ES-2', status: 'approved', valid_until: '2026-10-10', total_cents: 5, locale: 'nl', customers: cust },
    ];
    const out = evaluateOffers(rows, exp - 47 * H, cfg, 'https://x');
    expect(out.map((c) => c.entityId)).toEqual(['a']);
    expect(out[0].stage).toBe('T-2d');
  });
});

describe('appointments', () => {
  it('24h and 2h before a confirmed appointment; contact_email wins', () => {
    const start = amsterdamToUtc('2026-10-01', '09:30');
    const rows = [
      { id: 'a', status: 'confirmed', type: 'inspection', scheduled_date: '2026-10-01', scheduled_time: '09:30:00', contact_name: 'Piet', contact_email: 'piet@x.nl', customers: cust, vehicles: null },
      { id: 'b', status: 'requested', type: 'inspection', scheduled_date: '2026-10-01', scheduled_time: '10:00:00', contact_name: null, contact_email: null, customers: cust, vehicles: null },
    ];
    const at23h = evaluateAppointments(rows, start - 23 * H, cfg, 'https://x', 'Addr');
    expect(at23h.map((c) => `${c.entityId}:${c.stage}`)).toEqual(['a:T-24h']);
    expect(at23h[0].recipient).toBe('piet@x.nl');
    const at1h = evaluateAppointments(rows, start - 1 * H, cfg, 'https://x', 'Addr');
    expect(at1h.map((c) => c.stage)).toEqual(['T-24h', 'T-2h']);
  });
});

describe('jobs', () => {
  it('only ready jobs', () => {
    expect(evaluateJobs([
      { id: 'a', number: 1, stage: 'ready', customers: cust },
      { id: 'b', number: 2, stage: 'qc', customers: cust },
    ], cfg).map((c) => c.entityId)).toEqual(['a']);
  });
});
