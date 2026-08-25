import { describe, it, expect } from 'vitest';
import { CustomerSchema } from '../src/modules/customers/schema';
import { VehicleSchema } from '../src/modules/vehicles/schema';
import { LeadSchema } from '../src/modules/leads/schema';
import { DocumentSchema, IssueDocumentSchema, CancelDocumentSchema } from '../src/modules/documents/schema';

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

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('DocumentSchema', () => {
  it('validates a minimal document', () => {
    const result = DocumentSchema.safeParse({
      doc_type: 'offer',
      customer_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid doc_type', () => {
    const result = DocumentSchema.safeParse({
      doc_type: 'receipt',
      customer_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing customer_id', () => {
    const result = DocumentSchema.safeParse({ doc_type: 'invoice' });
    expect(result.success).toBe(false);
  });

  it('accepts all doc types', () => {
    for (const doc_type of ['offer', 'repair_order', 'handover_note', 'invoice', 'credit_note']) {
      const result = DocumentSchema.safeParse({ doc_type, customer_id: VALID_UUID });
      expect(result.success).toBe(true);
    }
  });

  it('defaults locale to nl', () => {
    const result = DocumentSchema.parse({ doc_type: 'offer', customer_id: VALID_UUID });
    expect(result.locale).toBe('nl');
  });

  it('accepts optional payload', () => {
    const result = DocumentSchema.safeParse({
      doc_type: 'invoice',
      customer_id: VALID_UUID,
      payload: { lines: [{ desc: 'Repair', amount: 5000 }] },
    });
    expect(result.success).toBe(true);
  });
});

describe('IssueDocumentSchema', () => {
  it('requires id and payload', () => {
    expect(IssueDocumentSchema.safeParse({}).success).toBe(false);
    expect(IssueDocumentSchema.safeParse({ id: VALID_UUID }).success).toBe(false);
    expect(IssueDocumentSchema.safeParse({ payload: {} }).success).toBe(false);
  });

  it('validates with id and payload', () => {
    const result = IssueDocumentSchema.safeParse({
      id: VALID_UUID,
      payload: { total_cents: 12500 },
    });
    expect(result.success).toBe(true);
  });
});

describe('CancelDocumentSchema', () => {
  it('requires id and non-empty reason', () => {
    expect(CancelDocumentSchema.safeParse({}).success).toBe(false);
    expect(CancelDocumentSchema.safeParse({ id: VALID_UUID, cancel_reason: '' }).success).toBe(false);
  });

  it('validates with id and reason', () => {
    const result = CancelDocumentSchema.safeParse({
      id: VALID_UUID,
      cancel_reason: 'Customer withdrew request',
    });
    expect(result.success).toBe(true);
  });
});
