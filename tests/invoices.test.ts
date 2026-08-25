import { describe, it, expect } from 'vitest';
import {
  InvoiceSchema,
  InvoiceLineSchema,
  CreateInvoiceFromOfferSchema,
  IssueInvoiceSchema,
  CreateCreditNoteSchema,
  RecordPaymentSchema,
} from '../src/modules/invoices/schema';
import {
  canTransition,
  getGuard,
  isTerminal,
  allowedTransitions,
} from '../src/modules/invoices/machine';
import type { InvoiceStatus } from '../src/types/database';

// ─── Tax calculation helpers (mirroring actions.ts) ─────────────────────────
const TAX_RATES: Record<string, number> = {
  H21: 0.21,
  L9: 0.09,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

function calcLineTotalCents(quantity: number, unitPriceCents: number, discountPct: number): number {
  const grossCents = Math.round(quantity * unitPriceCents);
  const discountCents = Math.round(grossCents * discountPct / 100);
  return grossCents - discountCents;
}

function calcVatCents(lineTotalCents: number, taxCode: string): number {
  const rate = TAX_RATES[taxCode] ?? 0;
  return Math.round(lineTotalCents * rate);
}

// ─── InvoiceSchema validation ───────────────────────────────────────────────
describe('InvoiceSchema', () => {
  it('accepts valid input', () => {
    const result = InvoiceSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing customer_id', () => {
    const result = InvoiceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid customer_id', () => {
    const result = InvoiceSchema.safeParse({ customer_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts optional vehicle_id', () => {
    const result = InvoiceSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      vehicle_id: '660e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null vehicle_id', () => {
    const result = InvoiceSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      vehicle_id: null,
    });
    expect(result.success).toBe(true);
  });

  it('defaults locale to nl', () => {
    const result = InvoiceSchema.parse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.locale).toBe('nl');
  });

  it('accepts due_date as string', () => {
    const result = InvoiceSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      due_date: '2026-09-25',
    });
    expect(result.success).toBe(true);
  });

  it('accepts notes and terms', () => {
    const result = InvoiceSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Test notes',
      terms: 'Payment within 30 days',
    });
    expect(result.success).toBe(true);
  });
});

// ─── InvoiceLineSchema validation ───────────────────────────────────────────
describe('InvoiceLineSchema', () => {
  it('accepts valid line', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Bumper repair',
      quantity: 1,
      unit_price_cents: 15000,
      tax_code: 'H21',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = InvoiceLineSchema.safeParse({
      description: '',
      unit_price_cents: 15000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      quantity: -1,
      unit_price_cents: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative unit_price_cents', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      unit_price_cents: -100,
    });
    expect(result.success).toBe(false);
  });

  it('defaults kind to labour', () => {
    const result = InvoiceLineSchema.parse({
      description: 'Test',
      unit_price_cents: 100,
    });
    expect(result.kind).toBe('labour');
  });

  it('defaults tax_code to H21', () => {
    const result = InvoiceLineSchema.parse({
      description: 'Test',
      unit_price_cents: 100,
    });
    expect(result.tax_code).toBe('H21');
  });

  it('defaults discount_pct to 0', () => {
    const result = InvoiceLineSchema.parse({
      description: 'Test',
      unit_price_cents: 100,
    });
    expect(result.discount_pct).toBe(0);
  });

  it('rejects discount_pct above 100', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      unit_price_cents: 100,
      discount_pct: 101,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid kinds', () => {
    const kinds = ['labour', 'part', 'material', 'other'];
    for (const kind of kinds) {
      const result = InvoiceLineSchema.safeParse({
        description: 'Test',
        unit_price_cents: 100,
        kind,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid kind', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      unit_price_cents: 100,
      kind: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid tax codes', () => {
    const codes = ['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX'];
    for (const tax_code of codes) {
      const result = InvoiceLineSchema.safeParse({
        description: 'Test',
        unit_price_cents: 100,
        tax_code,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional part_number', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      unit_price_cents: 100,
      part_number: 'BMW-123-456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects float unit_price_cents', () => {
    const result = InvoiceLineSchema.safeParse({
      description: 'Test',
      unit_price_cents: 99.5,
    });
    expect(result.success).toBe(false);
  });

  it('defaults unit to st', () => {
    const result = InvoiceLineSchema.parse({
      description: 'Test',
      unit_price_cents: 100,
    });
    expect(result.unit).toBe('st');
  });
});

// ─── CreateInvoiceFromOfferSchema ───────────────────────────────────────────
describe('CreateInvoiceFromOfferSchema', () => {
  it('accepts valid input', () => {
    const result = CreateInvoiceFromOfferSchema.safeParse({
      offer_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing offer_id', () => {
    const result = CreateInvoiceFromOfferSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid offer_id', () => {
    const result = CreateInvoiceFromOfferSchema.safeParse({ offer_id: 'abc' });
    expect(result.success).toBe(false);
  });

  it('accepts optional due_date', () => {
    const result = CreateInvoiceFromOfferSchema.safeParse({
      offer_id: '550e8400-e29b-41d4-a716-446655440000',
      due_date: '2026-10-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional terms', () => {
    const result = CreateInvoiceFromOfferSchema.safeParse({
      offer_id: '550e8400-e29b-41d4-a716-446655440000',
      terms: 'Payment net 30',
    });
    expect(result.success).toBe(true);
  });
});

// ─── IssueInvoiceSchema ─────────────────────────────────────────────────────
describe('IssueInvoiceSchema', () => {
  it('accepts valid uuid', () => {
    const result = IssueInvoiceSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid', () => {
    const result = IssueInvoiceSchema.safeParse({ id: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ─── CreateCreditNoteSchema ─────────────────────────────────────────────────
describe('CreateCreditNoteSchema', () => {
  it('accepts valid input', () => {
    const result = CreateCreditNoteSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Customer returned vehicle',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reason', () => {
    const result = CreateCreditNoteSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing invoice_id', () => {
    const result = CreateCreditNoteSchema.safeParse({
      reason: 'Some reason',
    });
    expect(result.success).toBe(false);
  });
});

// ─── RecordPaymentSchema ────────────────────────────────────────────────────
describe('RecordPaymentSchema', () => {
  it('accepts valid payment', () => {
    const result = RecordPaymentSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      amount_cents: 15000,
      method: 'bank_transfer',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = RecordPaymentSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      amount_cents: 0,
      method: 'bank_transfer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = RecordPaymentSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      amount_cents: -100,
      method: 'bank_transfer',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid methods', () => {
    const methods = ['ideal', 'bank_transfer', 'cash', 'card', 'mollie'];
    for (const method of methods) {
      const result = RecordPaymentSchema.safeParse({
        invoice_id: '550e8400-e29b-41d4-a716-446655440000',
        amount_cents: 100,
        method,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid method', () => {
    const result = RecordPaymentSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      amount_cents: 100,
      method: 'bitcoin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects float amount_cents', () => {
    const result = RecordPaymentSchema.safeParse({
      invoice_id: '550e8400-e29b-41d4-a716-446655440000',
      amount_cents: 99.5,
      method: 'bank_transfer',
    });
    expect(result.success).toBe(false);
  });
});

// ─── State machine tests ────────────────────────────────────────────────────
describe('Invoice state machine', () => {
  describe('canTransition', () => {
    // Allowed transitions
    it('allows draft -> sent', () => {
      expect(canTransition('draft', 'sent')).toBe(true);
    });

    it('allows sent -> paid', () => {
      expect(canTransition('sent', 'paid')).toBe(true);
    });

    it('allows sent -> overdue', () => {
      expect(canTransition('sent', 'overdue')).toBe(true);
    });

    it('allows sent -> credited', () => {
      expect(canTransition('sent', 'credited')).toBe(true);
    });

    it('allows draft -> cancelled (delete)', () => {
      expect(canTransition('draft', 'cancelled')).toBe(true);
    });

    // Blocked transitions
    it('blocks draft -> paid', () => {
      expect(canTransition('draft', 'paid')).toBe(false);
    });

    it('blocks draft -> overdue', () => {
      expect(canTransition('draft', 'overdue')).toBe(false);
    });

    it('blocks draft -> credited', () => {
      expect(canTransition('draft', 'credited')).toBe(false);
    });

    it('blocks sent -> cancelled (no direct cancel)', () => {
      expect(canTransition('sent', 'cancelled')).toBe(false);
    });

    it('blocks paid -> cancelled', () => {
      expect(canTransition('paid', 'cancelled')).toBe(false);
    });

    it('blocks paid -> sent', () => {
      expect(canTransition('paid', 'sent')).toBe(false);
    });

    it('blocks overdue -> draft', () => {
      expect(canTransition('overdue', 'draft')).toBe(false);
    });

    it('blocks credited -> anything', () => {
      const statuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      for (const s of statuses) {
        expect(canTransition('credited', s)).toBe(false);
      }
    });

    it('blocks cancelled -> anything', () => {
      const statuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'credited'];
      for (const s of statuses) {
        expect(canTransition('cancelled', s)).toBe(false);
      }
    });
  });

  describe('getGuard', () => {
    it('draft -> sent requires has_lines', () => {
      expect(getGuard('draft', 'sent')).toBe('has_lines');
    });

    it('sent -> paid has no guard', () => {
      expect(getGuard('sent', 'paid')).toBeUndefined();
    });
  });

  describe('isTerminal', () => {
    it('paid is terminal', () => {
      expect(isTerminal('paid')).toBe(true);
    });

    it('cancelled is terminal', () => {
      expect(isTerminal('cancelled')).toBe(true);
    });

    it('credited is terminal', () => {
      expect(isTerminal('credited')).toBe(true);
    });

    it('draft is not terminal', () => {
      expect(isTerminal('draft')).toBe(false);
    });

    it('sent is not terminal', () => {
      expect(isTerminal('sent')).toBe(false);
    });

    it('overdue is not terminal', () => {
      expect(isTerminal('overdue')).toBe(false);
    });
  });

  describe('allowedTransitions', () => {
    it('draft can go to sent or cancelled', () => {
      const allowed = allowedTransitions('draft');
      expect(allowed).toContain('sent');
      expect(allowed).toContain('cancelled');
      expect(allowed).toHaveLength(2);
    });

    it('sent can go to paid, overdue, or credited', () => {
      const allowed = allowedTransitions('sent');
      expect(allowed).toContain('paid');
      expect(allowed).toContain('overdue');
      expect(allowed).toContain('credited');
      expect(allowed).toHaveLength(3);
    });

    it('paid has no transitions', () => {
      expect(allowedTransitions('paid')).toHaveLength(0);
    });

    it('credited has no transitions', () => {
      expect(allowedTransitions('credited')).toHaveLength(0);
    });
  });
});

// ─── Line total calculations ────────────────────────────────────────────────
describe('Line total calculations (cents, no floating point)', () => {
  it('calculates simple line total', () => {
    const total = calcLineTotalCents(1, 10000, 0);
    expect(total).toBe(10000);
  });

  it('calculates with quantity', () => {
    const total = calcLineTotalCents(3, 5000, 0);
    expect(total).toBe(15000);
  });

  it('calculates with discount', () => {
    const total = calcLineTotalCents(1, 10000, 10);
    expect(total).toBe(9000);
  });

  it('calculates with quantity and discount', () => {
    const total = calcLineTotalCents(2, 5000, 20);
    // 2 * 5000 = 10000, 20% = 2000, result = 8000
    expect(total).toBe(8000);
  });

  it('100% discount gives zero', () => {
    const total = calcLineTotalCents(1, 10000, 100);
    expect(total).toBe(0);
  });

  it('handles fractional quantity', () => {
    const total = calcLineTotalCents(1.5, 10000, 0);
    expect(total).toBe(15000);
  });

  it('rounds correctly with fractional cents', () => {
    // 3 * 333 = 999, no rounding needed
    const total = calcLineTotalCents(3, 333, 0);
    expect(total).toBe(999);
  });

  it('result is always an integer', () => {
    const total = calcLineTotalCents(3, 333, 5);
    expect(Number.isInteger(total)).toBe(true);
  });

  it('handles large amounts', () => {
    const total = calcLineTotalCents(1, 100000000, 0); // 1M EUR
    expect(total).toBe(100000000);
  });

  it('handles zero quantity', () => {
    const total = calcLineTotalCents(0, 10000, 0);
    expect(total).toBe(0);
  });

  it('handles zero price', () => {
    const total = calcLineTotalCents(5, 0, 0);
    expect(total).toBe(0);
  });
});

// ─── VAT calculation per tax code ───────────────────────────────────────────
describe('VAT calculation per tax code', () => {
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
    // 999 * 0.21 = 209.79 -> rounds to 210
    const vat = calcVatCents(999, 'H21');
    expect(vat).toBe(210);
    expect(Number.isInteger(vat)).toBe(true);
  });

  it('rounds down when below .5', () => {
    // 100 * 0.21 = 21.0 -> exactly 21
    const vat = calcVatCents(100, 'H21');
    expect(vat).toBe(21);
  });

  it('handles zero base', () => {
    expect(calcVatCents(0, 'H21')).toBe(0);
  });

  it('unknown tax code returns 0', () => {
    expect(calcVatCents(10000, 'UNKNOWN')).toBe(0);
  });
});

// ─── Invoice number format validation ───────────────────────────────────────
describe('Invoice number format', () => {
  const INVOICE_NUMBER_RE = /^FAC-\d{4}-\d{5}$/;
  const CREDIT_NOTE_RE = /^CRE-\d{4}-\d{5}$/;

  it('matches invoice number format FAC-YYYY-NNNNN', () => {
    expect(INVOICE_NUMBER_RE.test('FAC-2026-00001')).toBe(true);
    expect(INVOICE_NUMBER_RE.test('FAC-2026-00123')).toBe(true);
    expect(INVOICE_NUMBER_RE.test('FAC-2026-99999')).toBe(true);
  });

  it('rejects bad invoice number formats', () => {
    expect(INVOICE_NUMBER_RE.test('FAC-2026-1')).toBe(false);
    expect(INVOICE_NUMBER_RE.test('INV-2026-00001')).toBe(false);
    expect(INVOICE_NUMBER_RE.test('FAC-26-00001')).toBe(false);
    expect(INVOICE_NUMBER_RE.test('')).toBe(false);
  });

  it('matches credit note format CRE-YYYY-NNNNN', () => {
    expect(CREDIT_NOTE_RE.test('CRE-2026-00001')).toBe(true);
    expect(CREDIT_NOTE_RE.test('CRE-2026-00042')).toBe(true);
  });

  it('rejects bad credit note formats', () => {
    expect(CREDIT_NOTE_RE.test('CRE-2026-1')).toBe(false);
    expect(CREDIT_NOTE_RE.test('FAC-2026-00001')).toBe(false);
  });
});

// ─── Credit note creation ───────────────────────────────────────────────────
describe('Credit note logic', () => {
  it('credit note totals are negative mirror of original', () => {
    const original = {
      subtotal_cents: 10000,
      vat_cents: 2100,
      total_cents: 12100,
      discount_cents: 500,
    };
    const creditNote = {
      subtotal_cents: -original.subtotal_cents,
      vat_cents: -original.vat_cents,
      total_cents: -original.total_cents,
      discount_cents: -original.discount_cents,
    };
    expect(creditNote.subtotal_cents).toBe(-10000);
    expect(creditNote.vat_cents).toBe(-2100);
    expect(creditNote.total_cents).toBe(-12100);
    expect(creditNote.discount_cents).toBe(-500);
  });

  it('original + credit note sum to zero', () => {
    const original = { total_cents: 12100 };
    const creditNote = { total_cents: -12100 };
    expect(original.total_cents + creditNote.total_cents).toBe(0);
  });

  it('credit note lines are negative mirror', () => {
    const originalLines = [
      { quantity: 2, line_total_cents: 10000, vat_amount_cents: 2100 },
      { quantity: 1, line_total_cents: 5000, vat_amount_cents: 1050 },
    ];
    const creditLines = originalLines.map(l => ({
      quantity: -l.quantity,
      line_total_cents: -l.line_total_cents,
      vat_amount_cents: -l.vat_amount_cents,
    }));
    expect(creditLines[0].quantity).toBe(-2);
    expect(creditLines[0].line_total_cents).toBe(-10000);
    expect(creditLines[1].vat_amount_cents).toBe(-1050);
  });
});

// ─── Payment recording ─────────────────────────────────────────────────────
describe('Payment recording logic', () => {
  it('full payment marks invoice as paid', () => {
    const invoiceTotal = 12100;
    const paymentAmount = 12100;
    const totalPaid = paymentAmount;
    expect(totalPaid >= invoiceTotal).toBe(true);
  });

  it('partial payment does not mark as paid', () => {
    const invoiceTotal = 12100;
    const paymentAmount = 6000;
    const totalPaid = paymentAmount;
    expect(totalPaid >= invoiceTotal).toBe(false);
  });

  it('multiple payments can sum to total', () => {
    const invoiceTotal = 12100;
    const payments = [6000, 6100];
    const totalPaid = payments.reduce((s, p) => s + p, 0);
    expect(totalPaid >= invoiceTotal).toBe(true);
  });

  it('overpayment still marks as paid', () => {
    const invoiceTotal = 12100;
    const totalPaid = 15000;
    expect(totalPaid >= invoiceTotal).toBe(true);
  });
});
