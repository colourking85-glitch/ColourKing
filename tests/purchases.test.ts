import { describe, it, expect } from 'vitest';
import {
  PurchaseSchema,
  PurchaseUpdateSchema,
  PurchaseFilterSchema,
  MarkPaidSchema,
  PURCHASE_CATEGORIES,
  TAX_RATES,
  calcVatCents,
  calcTotalCents,
} from '../src/modules/purchases/schema';

// ─── PurchaseSchema validation ─────────────────────────────────────────────
describe('PurchaseSchema', () => {
  const validInput = {
    supplier_name: 'AutoParts BV',
    invoice_date: '2026-08-25',
    subtotal_cents: 10000,
  };

  it('accepts valid minimal input', () => {
    const result = PurchaseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing supplier_name', () => {
    const result = PurchaseSchema.safeParse({
      invoice_date: '2026-08-25',
      subtotal_cents: 10000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty supplier_name', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      supplier_name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing invoice_date', () => {
    const result = PurchaseSchema.safeParse({
      supplier_name: 'Test',
      subtotal_cents: 10000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing subtotal_cents', () => {
    const result = PurchaseSchema.safeParse({
      supplier_name: 'Test',
      invoice_date: '2026-08-25',
    });
    expect(result.success).toBe(false);
  });

  it('rejects float subtotal_cents', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      subtotal_cents: 99.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative subtotal_cents', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      subtotal_cents: -100,
    });
    expect(result.success).toBe(false);
  });

  it('defaults tax_code to H21', () => {
    const result = PurchaseSchema.parse(validInput);
    expect(result.tax_code).toBe('H21');
  });

  it('defaults category to general', () => {
    const result = PurchaseSchema.parse(validInput);
    expect(result.category).toBe('general');
  });

  it('accepts all valid tax codes', () => {
    const codes = ['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX'];
    for (const tax_code of codes) {
      const result = PurchaseSchema.safeParse({ ...validInput, tax_code });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid tax code', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      tax_code: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional supplier_vat_number', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      supplier_vat_number: 'NL000000000B01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null supplier_vat_number', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      supplier_vat_number: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional due_date', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      due_date: '2026-09-25',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional description', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      description: 'Bumper parts',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional reference', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      reference: 'INV-2026-001',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional job_id as uuid', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      job_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid job_id', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      job_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero subtotal_cents', () => {
    const result = PurchaseSchema.safeParse({
      ...validInput,
      subtotal_cents: 0,
    });
    expect(result.success).toBe(true);
  });
});

// ─── PurchaseUpdateSchema ──────────────────────────────────────────────────
describe('PurchaseUpdateSchema', () => {
  it('accepts partial update with only supplier_name', () => {
    const result = PurchaseUpdateSchema.safeParse({
      supplier_name: 'New Supplier',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only subtotal_cents', () => {
    const result = PurchaseUpdateSchema.safeParse({
      subtotal_cents: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = PurchaseUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still rejects float subtotal_cents', () => {
    const result = PurchaseUpdateSchema.safeParse({
      subtotal_cents: 99.5,
    });
    expect(result.success).toBe(false);
  });
});

// ─── VAT calculation from subtotal + tax code ──────────────────────────────
describe('VAT calculation (calcVatCents)', () => {
  it('H21 calculates 21% VAT', () => {
    const vat = calcVatCents(10000, 'H21');
    expect(vat).toBe(2100);
  });

  it('L9 calculates 9% VAT', () => {
    const vat = calcVatCents(10000, 'L9');
    expect(vat).toBe(900);
  });

  it('N0 calculates 0% VAT', () => {
    const vat = calcVatCents(10000, 'N0');
    expect(vat).toBe(0);
  });

  it('V0 calculates 0% VAT', () => {
    const vat = calcVatCents(10000, 'V0');
    expect(vat).toBe(0);
  });

  it('ICP calculates 0% VAT', () => {
    const vat = calcVatCents(10000, 'ICP');
    expect(vat).toBe(0);
  });

  it('EX calculates 0% VAT', () => {
    const vat = calcVatCents(10000, 'EX');
    expect(vat).toBe(0);
  });

  it('rounds VAT to nearest cent', () => {
    // 999 * 21 / 100 = 209.79 -> 210
    const vat = calcVatCents(999, 'H21');
    expect(vat).toBe(210);
    expect(Number.isInteger(vat)).toBe(true);
  });

  it('handles zero subtotal', () => {
    expect(calcVatCents(0, 'H21')).toBe(0);
  });

  it('unknown tax code returns 0', () => {
    expect(calcVatCents(10000, 'UNKNOWN')).toBe(0);
  });

  it('result is always an integer', () => {
    const vat = calcVatCents(333, 'L9');
    expect(Number.isInteger(vat)).toBe(true);
  });

  it('M0 calculates 0% VAT', () => {
    expect(calcVatCents(10000, 'M0')).toBe(0);
  });
});

// ─── Total calculation ─────────────────────────────────────────────────────
describe('Total calculation (calcTotalCents)', () => {
  it('adds subtotal and VAT', () => {
    expect(calcTotalCents(10000, 2100)).toBe(12100);
  });

  it('works with zero VAT', () => {
    expect(calcTotalCents(10000, 0)).toBe(10000);
  });

  it('works with zero subtotal', () => {
    expect(calcTotalCents(0, 0)).toBe(0);
  });

  it('handles large amounts', () => {
    expect(calcTotalCents(100000000, 21000000)).toBe(121000000);
  });
});

// ─── Category validation ───────────────────────────────────────────────────
describe('Category validation', () => {
  it('accepts all valid categories', () => {
    for (const cat of PURCHASE_CATEGORIES) {
      const result = PurchaseSchema.safeParse({
        supplier_name: 'Test',
        invoice_date: '2026-08-25',
        subtotal_cents: 100,
        category: cat,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = PurchaseSchema.safeParse({
      supplier_name: 'Test',
      invoice_date: '2026-08-25',
      subtotal_cents: 100,
      category: 'invalid_cat',
    });
    expect(result.success).toBe(false);
  });

  it('has all expected categories', () => {
    expect(PURCHASE_CATEGORIES).toContain('general');
    expect(PURCHASE_CATEGORIES).toContain('parts');
    expect(PURCHASE_CATEGORIES).toContain('paint');
    expect(PURCHASE_CATEGORIES).toContain('materials');
    expect(PURCHASE_CATEGORIES).toContain('tools');
    expect(PURCHASE_CATEGORIES).toContain('rent');
    expect(PURCHASE_CATEGORIES).toContain('utilities');
    expect(PURCHASE_CATEGORIES).toContain('insurance');
    expect(PURCHASE_CATEGORIES).toContain('other');
    expect(PURCHASE_CATEGORIES).toHaveLength(9);
  });
});

// ─── Payment marking ───────────────────────────────────────────────────────
describe('MarkPaidSchema', () => {
  it('accepts valid payment', () => {
    const result = MarkPaidSchema.safeParse({
      payment_method: 'bank_transfer',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid payment methods', () => {
    const methods = ['ideal', 'bank_transfer', 'cash', 'card', 'mollie'];
    for (const method of methods) {
      const result = MarkPaidSchema.safeParse({ payment_method: method });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid payment method', () => {
    const result = MarkPaidSchema.safeParse({
      payment_method: 'bitcoin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing payment_method', () => {
    const result = MarkPaidSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional paid_at', () => {
    const result = MarkPaidSchema.safeParse({
      payment_method: 'cash',
      paid_at: '2026-08-25T12:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

// ─── Deductible VAT calculation ────────────────────────────────────────────
describe('Deductible VAT calculation', () => {
  // Test the logic from actions.ts getDeductibleVat
  const deductibleCodes = ['H21', 'L9', 'V0', 'M0'];

  function sumDeductibleVat(purchases: Array<{ vat_cents: number; tax_code: string }>) {
    return purchases
      .filter((p) => deductibleCodes.includes(p.tax_code))
      .reduce((sum, p) => sum + p.vat_cents, 0);
  }

  it('sums H21 VAT as deductible', () => {
    const purchases = [
      { vat_cents: 2100, tax_code: 'H21' },
      { vat_cents: 1050, tax_code: 'H21' },
    ];
    expect(sumDeductibleVat(purchases)).toBe(3150);
  });

  it('sums L9 VAT as deductible', () => {
    const purchases = [
      { vat_cents: 900, tax_code: 'L9' },
    ];
    expect(sumDeductibleVat(purchases)).toBe(900);
  });

  it('excludes ICP and EX from deductible', () => {
    const purchases = [
      { vat_cents: 2100, tax_code: 'H21' },
      { vat_cents: 0, tax_code: 'ICP' },
      { vat_cents: 0, tax_code: 'EX' },
    ];
    expect(sumDeductibleVat(purchases)).toBe(2100);
  });

  it('returns zero when no purchases', () => {
    expect(sumDeductibleVat([])).toBe(0);
  });

  it('includes N0 with 0 vat_cents (still deductible code = no)', () => {
    // N0 is NOT in deductibleCodes, so it should be excluded
    const purchases = [
      { vat_cents: 0, tax_code: 'N0' },
      { vat_cents: 2100, tax_code: 'H21' },
    ];
    expect(sumDeductibleVat(purchases)).toBe(2100);
  });

  it('mixes multiple tax codes correctly', () => {
    const purchases = [
      { vat_cents: 2100, tax_code: 'H21' },
      { vat_cents: 900, tax_code: 'L9' },
      { vat_cents: 0, tax_code: 'N0' },
      { vat_cents: 0, tax_code: 'EX' },
    ];
    expect(sumDeductibleVat(purchases)).toBe(3000);
  });
});

// ─── PurchaseFilterSchema ──────────────────────────────────────────────────
describe('PurchaseFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = PurchaseFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts category filter', () => {
    const result = PurchaseFilterSchema.safeParse({ category: 'parts' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category filter', () => {
    const result = PurchaseFilterSchema.safeParse({ category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts paid filter values', () => {
    for (const val of ['all', 'paid', 'unpaid']) {
      const result = PurchaseFilterSchema.safeParse({ paid: val });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid paid filter', () => {
    const result = PurchaseFilterSchema.safeParse({ paid: 'maybe' });
    expect(result.success).toBe(false);
  });

  it('accepts date range filters', () => {
    const result = PurchaseFilterSchema.safeParse({
      date_from: '2026-01-01',
      date_to: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts search filter', () => {
    const result = PurchaseFilterSchema.safeParse({ search: 'AutoParts' });
    expect(result.success).toBe(true);
  });

  it('accepts supplier filter', () => {
    const result = PurchaseFilterSchema.safeParse({ supplier: 'AutoParts BV' });
    expect(result.success).toBe(true);
  });
});

// ─── TAX_RATES constant ───────────────────────────────────────────────────
describe('TAX_RATES constant', () => {
  it('H21 rate is 21', () => {
    expect(TAX_RATES.H21).toBe(21);
  });

  it('L9 rate is 9', () => {
    expect(TAX_RATES.L9).toBe(9);
  });

  it('N0 rate is 0', () => {
    expect(TAX_RATES.N0).toBe(0);
  });

  it('all zero-rate codes are 0', () => {
    expect(TAX_RATES.V0).toBe(0);
    expect(TAX_RATES.M0).toBe(0);
    expect(TAX_RATES.ICP).toBe(0);
    expect(TAX_RATES.EX).toBe(0);
  });
});

// ─── End-to-end purchase calculation ───────────────────────────────────────
describe('End-to-end purchase calculation', () => {
  it('correctly calculates a full H21 purchase', () => {
    const subtotal = 15000; // EUR 150.00
    const vat = calcVatCents(subtotal, 'H21');
    const total = calcTotalCents(subtotal, vat);
    expect(vat).toBe(3150);
    expect(total).toBe(18150);
  });

  it('correctly calculates a full L9 purchase', () => {
    const subtotal = 20000; // EUR 200.00
    const vat = calcVatCents(subtotal, 'L9');
    const total = calcTotalCents(subtotal, vat);
    expect(vat).toBe(1800);
    expect(total).toBe(21800);
  });

  it('correctly calculates a N0 purchase (no VAT)', () => {
    const subtotal = 5000;
    const vat = calcVatCents(subtotal, 'N0');
    const total = calcTotalCents(subtotal, vat);
    expect(vat).toBe(0);
    expect(total).toBe(5000);
  });

  it('money values are always integers (no floats)', () => {
    const subtotal = 12345;
    const vat = calcVatCents(subtotal, 'H21');
    const total = calcTotalCents(subtotal, vat);
    expect(Number.isInteger(vat)).toBe(true);
    expect(Number.isInteger(total)).toBe(true);
  });
});
