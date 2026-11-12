import { describe, it, expect } from 'vitest';
import {
  shopMidnightUtc,
  vatPeriodRange,
  vatLockPeriod,
  VAT_COUNTED_STATUSES,
  VAT_PERIOD_LOCKED,
} from '../src/lib/vat-period';

const inRange = (iso: string, r: { start: string; end: string }) => {
  const t = new Date(iso).getTime();
  return t >= new Date(r.start).getTime() && t <= new Date(r.end).getTime();
};

describe('shopMidnightUtc', () => {
  it('handles winter time (CET, UTC+1)', () => {
    expect(shopMidnightUtc(2026, 0, 1).toISOString()).toBe('2025-12-31T23:00:00.000Z');
  });

  it('handles summer time (CEST, UTC+2)', () => {
    expect(shopMidnightUtc(2026, 6, 1).toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });

  it('handles the DST change days', () => {
    // Clocks go forward 29 Mar 2026 02:00 and back 25 Oct 2026 03:00
    expect(shopMidnightUtc(2026, 2, 29).toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(shopMidnightUtc(2026, 9, 25).toISOString()).toBe('2026-10-24T22:00:00.000Z');
  });

  it('rolls month overflow into the next year', () => {
    expect(shopMidnightUtc(2026, 12, 1).toISOString()).toBe('2026-12-31T23:00:00.000Z');
  });
});

describe('vatPeriodRange quarter boundaries', () => {
  const q3 = vatPeriodRange(2026, 3, 'quarter');
  const q4 = vatPeriodRange(2026, 4, 'quarter');

  it('puts an invoice issued 1 Oct 00:30 Amsterdam time in Q4, not Q3', () => {
    const issued = '2026-09-30T22:30:00.000Z'; // 1 Oct 00:30 CEST
    expect(inRange(issued, q3)).toBe(false);
    expect(inRange(issued, q4)).toBe(true);
  });

  it('puts an invoice issued 30 Sep 23:59 Amsterdam time in Q3', () => {
    const issued = '2026-09-30T21:59:00.000Z'; // 30 Sep 23:59 CEST
    expect(inRange(issued, q3)).toBe(true);
    expect(inRange(issued, q4)).toBe(false);
  });

  it('leaves no gap and no overlap between consecutive quarters', () => {
    expect(new Date(q3.end).getTime() + 1).toBe(new Date(q4.start).getTime());
  });

  it('covers the full year with four quarters', () => {
    const q1 = vatPeriodRange(2026, 1, 'quarter');
    const next = vatPeriodRange(2027, 1, 'quarter');
    expect(q1.start).toBe('2025-12-31T23:00:00.000Z');
    expect(new Date(q4.end).getTime() + 1).toBe(new Date(next.start).getTime());
  });
});

describe('VAT_COUNTED_STATUSES', () => {
  it('counts credited invoices in their own period', () => {
    expect(VAT_COUNTED_STATUSES).toContain('credited');
  });

  it('counts sent, paid and overdue invoices', () => {
    expect(VAT_COUNTED_STATUSES).toEqual(expect.arrayContaining(['sent', 'paid', 'overdue']));
  });

  it('never counts drafts or cancelled invoices', () => {
    expect(VAT_COUNTED_STATUSES).not.toContain('draft');
    expect(VAT_COUNTED_STATUSES).not.toContain('cancelled');
  });
});

describe('vatLockPeriod', () => {
  it('reads the period from a database error', () => {
    expect(vatLockPeriod({ message: 'VAT_PERIOD_LOCKED:2026-Q3', code: 'P0001' })).toBe('2026-Q3');
  });

  it('reads monthly periods', () => {
    expect(vatLockPeriod(new Error('VAT_PERIOD_LOCKED:2026-M07'))).toBe('2026-M07');
  });

  it('reads the period from an API response body', () => {
    expect(vatLockPeriod({ error: 'x', code: VAT_PERIOD_LOCKED, period: '2026-Q2' })).toBe('2026-Q2');
  });

  it('ignores other errors', () => {
    expect(vatLockPeriod(new Error('Only draft invoices can be edited'))).toBeNull();
    expect(vatLockPeriod({ error: 'Save failed' })).toBeNull();
    expect(vatLockPeriod(null)).toBeNull();
    expect(vatLockPeriod('VAT_PERIOD_LOCKED:2026-Q3')).toBeNull();
  });
});
