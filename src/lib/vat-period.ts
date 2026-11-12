/**
 * VAT period rules shared by the BTW engine (BW05) and the period lock.
 *
 * Periods follow shop time (Europe/Amsterdam), not the server clock (UTC on
 * Vercel): an invoice issued at 00:30 on 1 October belongs to Q4.
 * Keep in sync with supabase/migrations/0071_vat_period_lock.sql.
 */
import { SHOP_TIME_ZONE } from './booking-time';
import type { InvoiceStatus, VatPeriodType } from '@/types/database';

/** Error code raised by the database when a write touches a filed period. */
export const VAT_PERIOD_LOCKED = 'VAT_PERIOD_LOCKED';

/**
 * Invoice statuses that count towards a VAT return. A credited invoice still
 * counts in its own period; the credit note offsets it in the period it is
 * issued in.
 */
export const VAT_COUNTED_STATUSES: InvoiceStatus[] = ['sent', 'paid', 'overdue', 'credited'];

/** Offset of shop time from UTC, in ms, at the given instant. */
function shopOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** The UTC instant of 00:00 shop time on the given date (month 0-based, may overflow). */
export function shopMidnightUtc(year: number, monthIndex: number, day: number): Date {
  const wall = Date.UTC(year, monthIndex, day);
  let ts = wall - shopOffsetMs(wall);
  ts = wall - shopOffsetMs(ts); // second pass settles DST-change days
  return new Date(ts);
}

/**
 * Inclusive UTC range of a VAT period in shop time.
 * Quarters: Q1 = Jan–Mar … Q4 = Oct–Dec. Months: 1 = January.
 */
export function vatPeriodRange(
  year: number,
  period: number,
  periodType: VatPeriodType
): { start: string; end: string } {
  const firstMonth = periodType === 'quarter' ? (period - 1) * 3 : period - 1;
  const months = periodType === 'quarter' ? 3 : 1;
  const start = shopMidnightUtc(year, firstMonth, 1);
  const next = shopMidnightUtc(year, firstMonth + months, 1);
  return {
    start: start.toISOString(),
    end: new Date(next.getTime() - 1).toISOString(),
  };
}

/**
 * The locked period label ("2026-Q3", "2026-M07") when an error or API
 * response body is a VAT period lock rejection, otherwise null.
 */
export function vatLockPeriod(errorOrBody: unknown): string | null {
  if (!errorOrBody || typeof errorOrBody !== 'object') return null;
  const o = errorOrBody as { code?: unknown; period?: unknown; message?: unknown; error?: unknown };
  if (o.code === VAT_PERIOD_LOCKED && typeof o.period === 'string') return o.period;
  for (const text of [o.message, o.error]) {
    if (typeof text === 'string') {
      const m = text.match(/VAT_PERIOD_LOCKED:(\d{4}-(?:Q[1-4]|M\d{2}))/);
      if (m) return m[1];
    }
  }
  return null;
}
