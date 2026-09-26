import { describe, it, expect } from 'vitest';
import { REMINDER_DEFAULTS } from '@/modules/email/schema';
import { addDays, daysBetween, evaluateInvoices, evaluateOffers, evaluateAppointments, evaluateJobs } from './evaluators';

const today = '2026-09-26';
const cfg = REMINDER_DEFAULTS;
const cust = { name: 'Jan', email: 'jan@example.com', locale: 'nl', status: 'active' };

describe('date helpers', () => {
  it('adds days across month end', () => {
    expect(addDays('2026-09-29', 2)).toBe('2026-10-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });
  it('counts days between', () => {
    expect(daysBetween('2026-09-24', today)).toBe(2);
    expect(daysBetween(today, '2026-09-24')).toBe(-2);
  });
});

describe('invoices', () => {
  const base = { invoice_number: 'FA-1', total_cents: 1000, payment_token: 'tok', locale: 'nl', customers: cust };
  it('due-soon exactly days_before ahead, nothing at other offsets', () => {
    const rows = [
      { ...base, id: 'a', status: 'sent', due_date: addDays(today, 2) },
      { ...base, id: 'b', status: 'sent', due_date: addDays(today, 3) },
      { ...base, id: 'c', status: 'paid', due_date: addDays(today, 2) },
    ];
    const out = evaluateInvoices(rows, today, cfg, 'https://x', 'NL00');
    expect(out.map((c) => c.entityId)).toEqual(['a']);
    expect(out[0].stage).toBe('T-2');
    expect(out[0].data.payUrl).toBe('https://x/s/tok');
  });
  it('overdue exactly days_after past due, for sent or overdue status', () => {
    const rows = [
      { ...base, id: 'a', status: 'sent', due_date: addDays(today, -2) },
      { ...base, id: 'b', status: 'overdue', due_date: addDays(today, -2) },
      { ...base, id: 'c', status: 'sent', due_date: addDays(today, -3) },
    ];
    const out = evaluateInvoices(rows, today, cfg, 'https://x', 'NL00');
    expect(out.map((c) => c.entityId).sort()).toEqual(['a', 'b']);
    expect(out[0].data.daysOverdue).toBe(2);
  });
  it('skips blocked customers and keeps null recipient when no email', () => {
    const rows = [
      { ...base, id: 'a', status: 'sent', due_date: addDays(today, 2), customers: { ...cust, status: 'blocked' } },
      { ...base, id: 'b', status: 'sent', due_date: addDays(today, 2), customers: { ...cust, email: null } },
    ];
    const out = evaluateInvoices(rows, today, cfg, 'https://x', 'NL00');
    expect(out).toHaveLength(1);
    expect(out[0].recipient).toBeNull();
  });
});

describe('offers', () => {
  it('sent offers expiring in days_before days', () => {
    const rows = [
      { id: 'a', offer_number: 'ES-1', status: 'sent', valid_until: addDays(today, 2), total_cents: 5, locale: 'en', customers: cust },
      { id: 'b', offer_number: 'ES-2', status: 'approved', valid_until: addDays(today, 2), total_cents: 5, locale: 'nl', customers: cust },
    ];
    const out = evaluateOffers(rows, today, cfg, 'https://x');
    expect(out.map((c) => c.entityId)).toEqual(['a']);
    expect(out[0].locale).toBe('nl');
  });
});

describe('appointments', () => {
  it('confirmed appointments tomorrow, contact_email wins over customer email', () => {
    const rows = [
      { id: 'a', status: 'confirmed', type: 'inspection', scheduled_date: addDays(today, 1), scheduled_time: '09:30:00', contact_name: 'Piet', contact_email: 'piet@x.nl', customers: cust, vehicles: null },
      { id: 'b', status: 'requested', type: 'inspection', scheduled_date: addDays(today, 1), scheduled_time: '10:00:00', contact_name: null, contact_email: null, customers: cust, vehicles: null },
    ];
    const out = evaluateAppointments(rows, today, cfg, 'https://x', 'Addr');
    expect(out).toHaveLength(1);
    expect(out[0].recipient).toBe('piet@x.nl');
    expect(out[0].data.scheduledTime).toBe('09:30');
  });
});

describe('jobs', () => {
  it('only ready jobs', () => {
    const out = evaluateJobs([
      { id: 'a', number: 1, stage: 'ready', customers: cust },
      { id: 'b', number: 2, stage: 'qc', customers: cust },
    ], cfg);
    expect(out.map((c) => c.entityId)).toEqual(['a']);
  });
});
