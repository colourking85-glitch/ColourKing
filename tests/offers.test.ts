import { describe, it, expect } from 'vitest';
import { OfferSchema, OfferLineSchema, ApproveOfferSchema, RejectOfferSchema } from '../src/modules/offers/schema';
import { canTransition, isTerminal, allowedTransitions, getGuard } from '../src/modules/offers/machine';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ── Schema tests ──────────────────────────────────────────────────────

describe('OfferSchema', () => {
  it('validates a minimal offer', () => {
    const result = OfferSchema.safeParse({ customer_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('rejects missing customer_id', () => {
    const result = OfferSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid customer_id', () => {
    const result = OfferSchema.safeParse({ customer_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('defaults type to offer', () => {
    const result = OfferSchema.parse({ customer_id: VALID_UUID });
    expect(result.type).toBe('offer');
  });

  it('defaults origin to manual', () => {
    const result = OfferSchema.parse({ customer_id: VALID_UUID });
    expect(result.origin).toBe('manual');
  });

  it('defaults locale to nl', () => {
    const result = OfferSchema.parse({ customer_id: VALID_UUID });
    expect(result.locale).toBe('nl');
  });

  it('accepts all offer types', () => {
    for (const type of ['offer', 'supplement']) {
      const result = OfferSchema.safeParse({ customer_id: VALID_UUID, type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid offer type', () => {
    const result = OfferSchema.safeParse({ customer_id: VALID_UUID, type: 'invoice' });
    expect(result.success).toBe(false);
  });

  it('accepts all origins', () => {
    for (const origin of ['website', 'manual', 'phone', 'email', 'walk_in']) {
      const result = OfferSchema.safeParse({ customer_id: VALID_UUID, origin });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional fields', () => {
    const result = OfferSchema.safeParse({
      customer_id: VALID_UUID,
      vehicle_id: VALID_UUID,
      lead_id: VALID_UUID,
      job_id: VALID_UUID,
      notes: 'Some notes',
      valid_until: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });
});

describe('OfferLineSchema', () => {
  it('validates a minimal line', () => {
    const result = OfferLineSchema.safeParse({ description: 'Bumper spuiten' });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = OfferLineSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = OfferLineSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('defaults kind to labour', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.kind).toBe('labour');
  });

  it('defaults quantity to 1', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.quantity).toBe(1);
  });

  it('defaults unit to st', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.unit).toBe('st');
  });

  it('defaults unit_price_cents to 0', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.unit_price_cents).toBe(0);
  });

  it('defaults discount_pct to 0', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.discount_pct).toBe(0);
  });

  it('defaults tax_code to H21', () => {
    const result = OfferLineSchema.parse({ description: 'Test' });
    expect(result.tax_code).toBe('H21');
  });

  it('accepts all line kinds', () => {
    for (const kind of ['labour', 'part', 'material', 'other']) {
      const result = OfferLineSchema.safeParse({ description: 'Test', kind });
      expect(result.success).toBe(true);
    }
  });

  it('rejects negative quantity', () => {
    const result = OfferLineSchema.safeParse({ description: 'Test', quantity: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative unit_price_cents', () => {
    const result = OfferLineSchema.safeParse({ description: 'Test', unit_price_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects discount_pct over 100', () => {
    const result = OfferLineSchema.safeParse({ description: 'Test', discount_pct: 150 });
    expect(result.success).toBe(false);
  });

  it('accepts all tax codes', () => {
    for (const tax_code of ['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX']) {
      const result = OfferLineSchema.safeParse({ description: 'Test', tax_code });
      expect(result.success).toBe(true);
    }
  });

  it('validates a full line', () => {
    const result = OfferLineSchema.safeParse({
      kind: 'part',
      description: 'Achterbumper',
      quantity: 1,
      unit: 'st',
      unit_price_cents: 45000,
      discount_pct: 10,
      tax_code: 'H21',
      part_number: 'BMW-5112-8068936',
      sort_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('unit_price_cents must be integer', () => {
    const result = OfferLineSchema.safeParse({ description: 'Test', unit_price_cents: 99.5 });
    expect(result.success).toBe(false);
  });
});

describe('ApproveOfferSchema', () => {
  it('requires id and name', () => {
    expect(ApproveOfferSchema.safeParse({}).success).toBe(false);
    expect(ApproveOfferSchema.safeParse({ id: VALID_UUID }).success).toBe(false);
    expect(ApproveOfferSchema.safeParse({ approved_by_name: 'Jan' }).success).toBe(false);
  });

  it('validates with id and name', () => {
    const result = ApproveOfferSchema.safeParse({
      id: VALID_UUID,
      approved_by_name: 'Jan de Vries',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ApproveOfferSchema.safeParse({
      id: VALID_UUID,
      approved_by_name: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('RejectOfferSchema', () => {
  it('requires id and reason', () => {
    expect(RejectOfferSchema.safeParse({}).success).toBe(false);
    expect(RejectOfferSchema.safeParse({ id: VALID_UUID }).success).toBe(false);
    expect(RejectOfferSchema.safeParse({ rejected_reason: 'Too expensive' }).success).toBe(false);
  });

  it('validates with id and reason', () => {
    const result = RejectOfferSchema.safeParse({
      id: VALID_UUID,
      rejected_reason: 'Te duur',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reason', () => {
    const result = RejectOfferSchema.safeParse({
      id: VALID_UUID,
      rejected_reason: '',
    });
    expect(result.success).toBe(false);
  });
});

// ── State machine tests ───────────────────────────────────────────────

describe('Offer state machine', () => {
  describe('canTransition', () => {
    it('allows draft → sent', () => {
      expect(canTransition('draft', 'sent')).toBe(true);
    });

    it('allows sent → approved', () => {
      expect(canTransition('sent', 'approved')).toBe(true);
    });

    it('allows sent → rejected', () => {
      expect(canTransition('sent', 'rejected')).toBe(true);
    });

    it('allows sent → superseded', () => {
      expect(canTransition('sent', 'superseded')).toBe(true);
    });

    it('disallows draft → approved', () => {
      expect(canTransition('draft', 'approved')).toBe(false);
    });

    it('disallows draft → rejected', () => {
      expect(canTransition('draft', 'rejected')).toBe(false);
    });

    it('disallows approved → any', () => {
      expect(canTransition('approved', 'draft')).toBe(false);
      expect(canTransition('approved', 'sent')).toBe(false);
      expect(canTransition('approved', 'rejected')).toBe(false);
    });

    it('disallows rejected → any', () => {
      expect(canTransition('rejected', 'draft')).toBe(false);
      expect(canTransition('rejected', 'sent')).toBe(false);
      expect(canTransition('rejected', 'approved')).toBe(false);
    });

    it('disallows superseded → any', () => {
      expect(canTransition('superseded', 'draft')).toBe(false);
      expect(canTransition('superseded', 'sent')).toBe(false);
    });

    it('disallows sent → draft (no going back)', () => {
      expect(canTransition('sent', 'draft')).toBe(false);
    });
  });

  describe('getGuard', () => {
    it('draft → sent requires has_lines', () => {
      expect(getGuard('draft', 'sent')).toBe('has_lines');
    });

    it('sent → approved has no guard', () => {
      expect(getGuard('sent', 'approved')).toBeUndefined();
    });

    it('invalid transition has no guard', () => {
      expect(getGuard('draft', 'approved')).toBeUndefined();
    });
  });

  describe('isTerminal', () => {
    it('approved is terminal', () => {
      expect(isTerminal('approved')).toBe(true);
    });

    it('rejected is terminal', () => {
      expect(isTerminal('rejected')).toBe(true);
    });

    it('superseded is terminal', () => {
      expect(isTerminal('superseded')).toBe(true);
    });

    it('draft is not terminal', () => {
      expect(isTerminal('draft')).toBe(false);
    });

    it('sent is not terminal', () => {
      expect(isTerminal('sent')).toBe(false);
    });
  });

  describe('allowedTransitions', () => {
    it('draft can go to sent', () => {
      expect(allowedTransitions('draft')).toEqual(['sent']);
    });

    it('sent can go to approved, rejected, or superseded', () => {
      const allowed = allowedTransitions('sent');
      expect(allowed).toContain('approved');
      expect(allowed).toContain('rejected');
      expect(allowed).toContain('superseded');
      expect(allowed).toHaveLength(3);
    });

    it('approved has no transitions', () => {
      expect(allowedTransitions('approved')).toEqual([]);
    });

    it('rejected has no transitions', () => {
      expect(allowedTransitions('rejected')).toEqual([]);
    });

    it('superseded has no transitions', () => {
      expect(allowedTransitions('superseded')).toEqual([]);
    });
  });
});
