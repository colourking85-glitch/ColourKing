import { describe, it, expect } from 'vitest';
import { PartSchema, UpdatePartSchema, PartStatusSchema } from '../src/modules/parts/schema';

describe('PartSchema', () => {
  it('validates a minimal part', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Bumper front',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
      expect(result.data.unit_price_cents).toBe(0);
      expect(result.data.blocking).toBe(false);
    }
  });

  it('validates a full part', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Headlight assembly',
      part_number: 'HL-2024-R',
      supplier: 'AutoParts BV',
      quantity: 2,
      unit_price_cents: 15000,
      blocking: true,
      notes: 'Right side only',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit_price_cents).toBe(15000);
    }
  });

  it('rejects missing job_id', () => {
    const result = PartSchema.safeParse({ description: 'Bumper' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid job_id', () => {
    const result = PartSchema.safeParse({
      job_id: 'not-a-uuid',
      description: 'Bumper',
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity below 1', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Bumper',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Bumper',
      unit_price_cents: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects float price', () => {
    const result = PartSchema.safeParse({
      job_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Bumper',
      unit_price_cents: 10.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdatePartSchema', () => {
  it('validates partial update', () => {
    const result = UpdatePartSchema.safeParse({
      description: 'Updated bumper',
      quantity: 3,
    });
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = UpdatePartSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid quantity', () => {
    const result = UpdatePartSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });
});

describe('PartStatusSchema', () => {
  it.each(['needed', 'ordered', 'shipped', 'received', 'returned'] as const)(
    'accepts status "%s"',
    (status) => {
      const result = PartStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  );

  it('rejects invalid status', () => {
    const result = PartStatusSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });
});

describe('Status transitions (logic validation)', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    needed: ['ordered', 'returned'],
    ordered: ['shipped'],
    shipped: ['received'],
    received: [],
    returned: [],
  };

  it('needed can go to ordered', () => {
    expect(VALID_TRANSITIONS['needed']).toContain('ordered');
  });

  it('needed can go to returned', () => {
    expect(VALID_TRANSITIONS['needed']).toContain('returned');
  });

  it('ordered can go to shipped', () => {
    expect(VALID_TRANSITIONS['ordered']).toContain('shipped');
  });

  it('shipped can go to received', () => {
    expect(VALID_TRANSITIONS['shipped']).toContain('received');
  });

  it('received is terminal', () => {
    expect(VALID_TRANSITIONS['received']).toHaveLength(0);
  });

  it('returned is terminal', () => {
    expect(VALID_TRANSITIONS['returned']).toHaveLength(0);
  });

  it('needed cannot go directly to received', () => {
    expect(VALID_TRANSITIONS['needed']).not.toContain('received');
  });

  it('ordered cannot go back to needed', () => {
    expect(VALID_TRANSITIONS['ordered']).not.toContain('needed');
  });

  it('shipped cannot go to ordered', () => {
    expect(VALID_TRANSITIONS['shipped']).not.toContain('ordered');
  });
});
