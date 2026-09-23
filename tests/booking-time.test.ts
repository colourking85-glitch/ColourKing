import { describe, it, expect } from 'vitest';
import { shopNow, isSlotBookable } from '@/lib/booking-time';

// 2026-09-23 10:00 in Amsterdam (CEST, UTC+2) = 08:00 UTC
const at = (iso: string) => new Date(iso);

describe('shopNow', () => {
  it('uses Amsterdam time, not UTC', () => {
    expect(shopNow(at('2026-09-23T08:00:00Z'))).toEqual({ date: '2026-09-23', minutes: 600 });
  });

  it('rolls the date over at Amsterdam midnight', () => {
    expect(shopNow(at('2026-09-22T22:30:00Z')).date).toBe('2026-09-23');
  });
});

describe('isSlotBookable', () => {
  const now = at('2026-09-23T08:00:00Z'); // 10:00 shop time

  it('rejects past dates', () => {
    expect(isSlotBookable('2026-09-22', '16:00', now)).toBe(false);
  });

  it('allows any time on future dates', () => {
    expect(isSlotBookable('2026-09-24', '08:00', now)).toBe(true);
  });

  it('requires 2 hours lead time today', () => {
    expect(isSlotBookable('2026-09-23', '11:30', now)).toBe(false);
    expect(isSlotBookable('2026-09-23', '12:00', now)).toBe(true);
    expect(isSlotBookable('2026-09-23', '16:30', now)).toBe(true);
  });

  it('has no same-day slots left late in the afternoon', () => {
    const late = at('2026-09-23T13:00:00Z'); // 15:00 shop time
    expect(isSlotBookable('2026-09-23', '16:30', late)).toBe(false);
  });
});
