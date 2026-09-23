/**
 * Public booking time rules. The shop runs on Amsterdam time regardless of
 * where the server (Vercel, UTC) or the visitor's browser is.
 */

export const SHOP_TIME_ZONE = 'Europe/Amsterdam';

/** Same-day bookings must start at least this many minutes from now. */
export const BOOKING_LEAD_MINUTES = 120;

/** Current shop-local date (YYYY-MM-DD) and minutes since midnight. */
export function shopNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/**
 * Whether a slot (date YYYY-MM-DD, time HH:MM, shop-local) can still be
 * booked: not in the past, and same-day slots need the lead time.
 */
export function isSlotBookable(date: string, time: string, now: Date = new Date()): boolean {
  const { date: today, minutes } = shopNow(now);
  if (date < today) return false;
  if (date > today) return true;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m >= minutes + BOOKING_LEAD_MINUTES;
}
