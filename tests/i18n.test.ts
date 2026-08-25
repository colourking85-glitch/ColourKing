import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatNumber,
} from '@/lib/format';
import type { SupportedLocale } from '@/lib/format';

import en from '@/messages/en.json';
import nl from '@/messages/nl.json';
import tr from '@/messages/tr.json';

// ── Helper: collect all leaf keys from a nested object ─────────────────────
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Locale file key parity
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale file parity', () => {
  const enKeys = collectKeys(en);
  const nlKeys = collectKeys(nl);
  const trKeys = collectKeys(tr);

  it('en.json has at least 100 keys', () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(100);
  });

  it('nl.json has at least 100 keys', () => {
    expect(nlKeys.length).toBeGreaterThanOrEqual(100);
  });

  it('tr.json has at least 100 keys', () => {
    expect(trKeys.length).toBeGreaterThanOrEqual(100);
  });

  it('en and nl have the same keys', () => {
    const missingInNl = enKeys.filter((k) => !nlKeys.includes(k));
    const missingInEn = nlKeys.filter((k) => !enKeys.includes(k));
    expect(missingInNl).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('en and tr have the same keys', () => {
    const missingInTr = enKeys.filter((k) => !trKeys.includes(k));
    const missingInEn = trKeys.filter((k) => !enKeys.includes(k));
    expect(missingInTr).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('nl and tr have the same keys', () => {
    const missingInTr = nlKeys.filter((k) => !trKeys.includes(k));
    const missingInNl = trKeys.filter((k) => !nlKeys.includes(k));
    expect(missingInTr).toEqual([]);
    expect(missingInNl).toEqual([]);
  });

  it('no key has an empty string value in en', () => {
    const empty = enKeys.filter((k) => {
      const parts = k.split('.');
      let val: unknown = en;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return val === '';
    });
    expect(empty).toEqual([]);
  });

  it('no key has an empty string value in nl', () => {
    const empty = nlKeys.filter((k) => {
      const parts = k.split('.');
      let val: unknown = nl;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return val === '';
    });
    expect(empty).toEqual([]);
  });

  it('no key has an empty string value in tr', () => {
    const empty = trKeys.filter((k) => {
      const parts = k.split('.');
      let val: unknown = tr;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      return val === '';
    });
    expect(empty).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. formatCurrency
// ═══════════════════════════════════════════════════════════════════════════

describe('formatCurrency', () => {
  it('formats positive amount for NL', () => {
    const result = formatCurrency(123456, 'nl');
    // nl-NL uses non-breaking space: "€ 1.234,56" or similar
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formats positive amount for EN', () => {
    const result = formatCurrency(123456, 'en');
    expect(result).toContain('1,234.56');
    expect(result).toContain('€');
  });

  it('formats positive amount for TR', () => {
    const result = formatCurrency(123456, 'tr');
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formats zero', () => {
    expect(formatCurrency(0, 'nl')).toContain('0,00');
    expect(formatCurrency(0, 'en')).toContain('0.00');
    expect(formatCurrency(0, 'tr')).toContain('0,00');
  });

  it('formats negative amount for NL', () => {
    const result = formatCurrency(-50000, 'nl');
    expect(result).toContain('500,00');
    expect(result).toMatch(/-/);
  });

  it('formats negative amount for EN', () => {
    const result = formatCurrency(-50000, 'en');
    expect(result).toContain('500.00');
    expect(result).toMatch(/-/);
  });

  it('formats small amount (1 cent)', () => {
    const result = formatCurrency(1, 'nl');
    expect(result).toContain('0,01');
  });

  it('formats large amount', () => {
    const result = formatCurrency(99999999, 'en');
    expect(result).toContain('999,999.99');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. formatDate (long)
// ═══════════════════════════════════════════════════════════════════════════

describe('formatDate', () => {
  const date = new Date(2026, 7, 25); // 25 Aug 2026

  it('formats for NL', () => {
    const result = formatDate(date, 'nl');
    expect(result).toContain('25');
    expect(result.toLowerCase()).toContain('augustus');
    expect(result).toContain('2026');
  });

  it('formats for EN', () => {
    const result = formatDate(date, 'en');
    expect(result).toContain('25');
    expect(result).toContain('August');
    expect(result).toContain('2026');
  });

  it('formats for TR', () => {
    const result = formatDate(date, 'tr');
    expect(result).toContain('25');
    expect(result.toLowerCase()).toContain('ağustos');
    expect(result).toContain('2026');
  });

  it('accepts string input', () => {
    const result = formatDate('2026-08-25', 'nl');
    expect(result).toContain('25');
    expect(result).toContain('2026');
  });

  it('handles January correctly', () => {
    const jan = new Date(2026, 0, 1);
    expect(formatDate(jan, 'nl').toLowerCase()).toContain('januari');
    expect(formatDate(jan, 'en')).toContain('January');
    expect(formatDate(jan, 'tr').toLowerCase()).toContain('ocak');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. formatDateShort
// ═══════════════════════════════════════════════════════════════════════════

describe('formatDateShort', () => {
  const date = new Date(2026, 7, 25); // 25 Aug 2026

  it('formats NL with dashes', () => {
    expect(formatDateShort(date, 'nl')).toBe('25-08-2026');
  });

  it('formats EN with slashes', () => {
    expect(formatDateShort(date, 'en')).toBe('25/08/2026');
  });

  it('formats TR with dots', () => {
    expect(formatDateShort(date, 'tr')).toBe('25.08.2026');
  });

  it('pads single-digit day', () => {
    const d = new Date(2026, 0, 5); // 5 Jan
    expect(formatDateShort(d, 'nl')).toBe('05-01-2026');
    expect(formatDateShort(d, 'en')).toBe('05/01/2026');
    expect(formatDateShort(d, 'tr')).toBe('05.01.2026');
  });

  it('pads single-digit month', () => {
    const d = new Date(2026, 2, 15); // 15 Mar
    expect(formatDateShort(d, 'nl')).toBe('15-03-2026');
  });

  it('accepts string input', () => {
    expect(formatDateShort('2026-12-31', 'nl')).toBe('31-12-2026');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. formatNumber
// ═══════════════════════════════════════════════════════════════════════════

describe('formatNumber', () => {
  it('formats integer for NL', () => {
    expect(formatNumber(1234, 'nl')).toBe('1.234');
  });

  it('formats integer for EN', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
  });

  it('formats integer for TR', () => {
    expect(formatNumber(1234, 'tr')).toBe('1.234');
  });

  it('formats decimal for NL', () => {
    const result = formatNumber(1234.56, 'nl');
    expect(result).toBe('1.234,56');
  });

  it('formats decimal for EN', () => {
    const result = formatNumber(1234.56, 'en');
    expect(result).toBe('1,234.56');
  });

  it('formats decimal for TR', () => {
    const result = formatNumber(1234.56, 'tr');
    expect(result).toBe('1.234,56');
  });

  it('formats zero', () => {
    expect(formatNumber(0, 'nl')).toBe('0');
    expect(formatNumber(0, 'en')).toBe('0');
    expect(formatNumber(0, 'tr')).toBe('0');
  });

  it('formats negative number', () => {
    const result = formatNumber(-1234.56, 'en');
    expect(result).toBe('-1,234.56');
  });

  it('formats large number', () => {
    const result = formatNumber(1000000, 'nl');
    expect(result).toBe('1.000.000');
  });

  it('drops unnecessary trailing decimals', () => {
    // formatNumber uses maximumFractionDigits: 2 but minimumFractionDigits: 0
    expect(formatNumber(100, 'en')).toBe('100');
    expect(formatNumber(100.1, 'en')).toBe('100.1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Type safety
// ═══════════════════════════════════════════════════════════════════════════

describe('Type safety', () => {
  it('all three locales are valid SupportedLocale', () => {
    const locales: SupportedLocale[] = ['nl', 'en', 'tr'];
    locales.forEach((locale) => {
      expect(() => formatCurrency(100, locale)).not.toThrow();
      expect(() => formatDate(new Date(), locale)).not.toThrow();
      expect(() => formatDateShort(new Date(), locale)).not.toThrow();
      expect(() => formatNumber(42, locale)).not.toThrow();
    });
  });
});
