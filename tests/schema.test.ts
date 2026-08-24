import { describe, it, expect } from 'vitest';
import { CustomerSchema } from '../src/modules/customers/schema';
import { VehicleSchema } from '../src/modules/vehicles/schema';
import { LeadSchema } from '../src/modules/leads/schema';

describe('CustomerSchema', () => {
  it('validates a minimal customer', () => {
    const result = CustomerSchema.safeParse({ name: 'Jan de Vries' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CustomerSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults type to private', () => {
    const result = CustomerSchema.parse({ name: 'Test' });
    expect(result.type).toBe('private');
  });

  it('accepts all customer types', () => {
    for (const type of ['private', 'company', 'fleet', 'dealer']) {
      const result = CustomerSchema.safeParse({ name: 'Test', type });
      expect(result.success).toBe(true);
    }
  });
});

describe('VehicleSchema', () => {
  it('requires customer_id', () => {
    const result = VehicleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('validates with customer_id', () => {
    const result = VehicleSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      kenteken: 'AB-123-C',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid year', () => {
    const result = VehicleSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      year: 1800,
    });
    expect(result.success).toBe(false);
  });
});

describe('LeadSchema', () => {
  it('validates a minimal lead', () => {
    const result = LeadSchema.safeParse({ contact_name: 'Ahmed Yilmaz' });
    expect(result.success).toBe(true);
  });

  it('defaults status to new', () => {
    const result = LeadSchema.parse({ contact_name: 'Test' });
    expect(result.status).toBe('new');
  });

  it('accepts all statuses', () => {
    for (const status of ['new', 'contacted', 'quoted', 'won', 'lost']) {
      const result = LeadSchema.safeParse({ contact_name: 'Test', status });
      expect(result.success).toBe(true);
    }
  });
});
