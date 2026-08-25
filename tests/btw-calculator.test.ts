import { describe, it, expect } from 'vitest';
import {
  calculateFromIncl,
  calculateFromExcl,
  calculateAllRates,
  type VatBreakdown,
} from '../src/modules/btw-calculator/calculator';
import { calculatorInputSchema } from '../src/modules/btw-calculator/schema';

// ─── calculateFromIncl ──────────────────────────────────────────

describe('calculateFromIncl', () => {
  it('calculates 21% from 12100 cents incl', () => {
    const r = calculateFromIncl(12100, 'H21');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(2100);
    expect(r.inclCents).toBe(12100);
    expect(r.ratePercent).toBe(21);
  });

  it('calculates 9% from 10900 cents incl', () => {
    const r = calculateFromIncl(10900, 'L9');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(900);
    expect(r.inclCents).toBe(10900);
  });

  it('calculates 0% from 10000 cents incl', () => {
    const r = calculateFromIncl(10000, 'N0');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(10000);
  });

  it('handles rounding for 21% (1 cent incl)', () => {
    const r = calculateFromIncl(1, 'H21');
    // 1 * 100 / 121 = 0.826... → rounds to 1
    expect(r.exclCents).toBe(1);
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(1);
  });

  it('handles rounding for 21% (3 cents incl)', () => {
    const r = calculateFromIncl(3, 'H21');
    // 3 * 100 / 121 = 2.479... → rounds to 2
    expect(r.exclCents).toBe(2);
    expect(r.vatCents).toBe(1);
    expect(r.inclCents).toBe(3);
  });

  it('handles zero amount for 21%', () => {
    const r = calculateFromIncl(0, 'H21');
    expect(r.exclCents).toBe(0);
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(0);
  });

  it('handles zero amount for 0%', () => {
    const r = calculateFromIncl(0, 'N0');
    expect(r.exclCents).toBe(0);
    expect(r.vatCents).toBe(0);
  });

  it('handles large amount for 21%', () => {
    // 100000.00 incl → 82644.63 excl, 17355.37 vat (in cents: 10000000 → ...)
    const r = calculateFromIncl(10000000, 'H21');
    expect(r.exclCents).toBe(8264463);
    expect(r.vatCents).toBe(1735537);
    expect(r.exclCents + r.vatCents).toBe(10000000);
  });

  it('ensures excl + vat = incl for 9% rounding edge case', () => {
    const r = calculateFromIncl(999, 'L9');
    expect(r.exclCents + r.vatCents).toBe(999);
  });
});

// ─── calculateFromExcl ──────────────────────────────────────────

describe('calculateFromExcl', () => {
  it('calculates 21% from 10000 cents excl', () => {
    const r = calculateFromExcl(10000, 'H21');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(2100);
    expect(r.inclCents).toBe(12100);
  });

  it('calculates 9% from 10000 cents excl', () => {
    const r = calculateFromExcl(10000, 'L9');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(900);
    expect(r.inclCents).toBe(10900);
  });

  it('calculates 0% from 10000 cents excl', () => {
    const r = calculateFromExcl(10000, 'N0');
    expect(r.exclCents).toBe(10000);
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(10000);
  });

  it('handles rounding for 21% (1 cent excl)', () => {
    const r = calculateFromExcl(1, 'H21');
    // 1 * 21 / 100 = 0.21 → rounds to 0
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(1);
  });

  it('handles rounding for 21% (3 cents excl)', () => {
    const r = calculateFromExcl(3, 'H21');
    // 3 * 21 / 100 = 0.63 → rounds to 1
    expect(r.vatCents).toBe(1);
    expect(r.inclCents).toBe(4);
  });

  it('handles rounding for 9% (5 cents excl)', () => {
    const r = calculateFromExcl(5, 'L9');
    // 5 * 9 / 100 = 0.45 → rounds to 0 (half-up for .5 rounds up, but 0.45 rounds to 0)
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(5);
  });

  it('handles zero amount for 21%', () => {
    const r = calculateFromExcl(0, 'H21');
    expect(r.exclCents).toBe(0);
    expect(r.vatCents).toBe(0);
    expect(r.inclCents).toBe(0);
  });

  it('handles large amount for 9%', () => {
    const r = calculateFromExcl(10000000, 'L9');
    expect(r.vatCents).toBe(900000);
    expect(r.inclCents).toBe(10900000);
  });

  it('ensures excl + vat = incl for 21% rounding edge case', () => {
    const r = calculateFromExcl(777, 'H21');
    expect(r.exclCents + r.vatCents).toBe(r.inclCents);
  });
});

// ─── calculateAllRates ──────────────────────────────────────────

describe('calculateAllRates', () => {
  it('returns three results for incl input', () => {
    const results = calculateAllRates(12100, 'incl');
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.rate)).toEqual(['H21', 'L9', 'N0']);
  });

  it('returns three results for excl input', () => {
    const results = calculateAllRates(10000, 'excl');
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.rate)).toEqual(['H21', 'L9', 'N0']);
  });

  it('uses calculateFromIncl for incl input', () => {
    const results = calculateAllRates(12100, 'incl');
    const h21 = results.find((r) => r.rate === 'H21')!;
    expect(h21.exclCents).toBe(10000);
    expect(h21.vatCents).toBe(2100);
  });

  it('uses calculateFromExcl for excl input', () => {
    const results = calculateAllRates(10000, 'excl');
    const h21 = results.find((r) => r.rate === 'H21')!;
    expect(h21.exclCents).toBe(10000);
    expect(h21.vatCents).toBe(2100);
    expect(h21.inclCents).toBe(12100);
  });

  it('handles zero amount', () => {
    const results = calculateAllRates(0, 'incl');
    for (const r of results) {
      expect(r.exclCents).toBe(0);
      expect(r.vatCents).toBe(0);
      expect(r.inclCents).toBe(0);
    }
  });

  it('each result has correct rate percent', () => {
    const results = calculateAllRates(10000, 'excl');
    expect(results[0].ratePercent).toBe(21);
    expect(results[1].ratePercent).toBe(9);
    expect(results[2].ratePercent).toBe(0);
  });
});

// ─── Schema validation ──────────────────────────────────────────

describe('calculatorInputSchema', () => {
  it('accepts valid incl input', () => {
    const result = calculatorInputSchema.safeParse({ amount: 12100, inputType: 'incl' });
    expect(result.success).toBe(true);
  });

  it('accepts valid excl input', () => {
    const result = calculatorInputSchema.safeParse({ amount: 10000, inputType: 'excl' });
    expect(result.success).toBe(true);
  });

  it('accepts zero amount', () => {
    const result = calculatorInputSchema.safeParse({ amount: 0, inputType: 'incl' });
    expect(result.success).toBe(true);
  });

  it('rejects float amount', () => {
    const result = calculatorInputSchema.safeParse({ amount: 100.5, inputType: 'incl' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid inputType', () => {
    const result = calculatorInputSchema.safeParse({ amount: 100, inputType: 'gross' });
    expect(result.success).toBe(false);
  });

  it('rejects missing amount', () => {
    const result = calculatorInputSchema.safeParse({ inputType: 'incl' });
    expect(result.success).toBe(false);
  });

  it('rejects missing inputType', () => {
    const result = calculatorInputSchema.safeParse({ amount: 100 });
    expect(result.success).toBe(false);
  });
});
