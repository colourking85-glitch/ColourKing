import { describe, it, expect } from 'vitest';
import { RepairOrderPayloadSchema, HandoverPayloadSchema } from '../src/modules/repair-orders/schema';

describe('RepairOrderPayloadSchema', () => {
  const validPayload = {
    kenteken: 'AB-123-CD',
    make: 'BMW',
    model: '3 Serie',
    year: 2020,
    colour: 'Zwart',
    vin: 'WBAXXXXXXXXXXXXXXX',
    mileage_in: 45000,
    existing_damage: 'Kras linkerdeur',
    work_description: 'Spuitwerk linkerdeur + bumper',
    estimated_total_cents: 125000,
    terms_accepted: true,
    customer_name: 'Jan de Vries',
    customer_address: 'Hoofdstraat 1, 1234 AB Amsterdam',
    customer_phone: '+31612345678',
    customer_email: 'jan@example.com',
  };

  it('validates a complete payload', () => {
    const result = RepairOrderPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('validates a minimal payload', () => {
    const result = RepairOrderPayloadSchema.safeParse({
      kenteken: 'AB-123-CD',
      make: 'BMW',
      model: '3 Serie',
      work_description: 'Spuitwerk',
      estimated_total_cents: 0,
      terms_accepted: false,
      customer_name: 'Jan',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing kenteken', () => {
    const { kenteken: _, ...rest } = validPayload;
    const result = RepairOrderPayloadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing customer_name', () => {
    const { customer_name: _, ...rest } = validPayload;
    const result = RepairOrderPayloadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing work_description', () => {
    const { work_description: _, ...rest } = validPayload;
    const result = RepairOrderPayloadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects negative estimated_total_cents', () => {
    const result = RepairOrderPayloadSchema.safeParse({
      ...validPayload,
      estimated_total_cents: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects float estimated_total_cents', () => {
    const result = RepairOrderPayloadSchema.safeParse({
      ...validPayload,
      estimated_total_cents: 100.50,
    });
    expect(result.success).toBe(false);
  });

  it('defaults existing_damage to empty string', () => {
    const result = RepairOrderPayloadSchema.parse({
      kenteken: 'XX-11-YY',
      make: 'Audi',
      model: 'A4',
      work_description: 'Bumper vervangen',
      estimated_total_cents: 50000,
      terms_accepted: false,
      customer_name: 'Test',
    });
    expect(result.existing_damage).toBe('');
  });

  it('accepts null optional fields', () => {
    const result = RepairOrderPayloadSchema.safeParse({
      ...validPayload,
      year: null,
      colour: null,
      vin: null,
      mileage_in: null,
      customer_address: null,
      customer_phone: null,
      customer_email: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid customer_email', () => {
    const result = RepairOrderPayloadSchema.safeParse({
      ...validPayload,
      customer_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('HandoverPayloadSchema', () => {
  const validPayload = {
    work_summary: 'Linkerdeur en bumper gespoten',
    mileage_out: 45050,
    warranty_text: '2 jaar garantie op spuitwerk',
    gallery_consent: true,
    items_returned: ['Sleutels', 'Kentekenbewijs', 'Reservewiel'],
  };

  it('validates a complete payload', () => {
    const result = HandoverPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('validates a minimal payload', () => {
    const result = HandoverPayloadSchema.safeParse({
      work_summary: 'Werk voltooid',
      mileage_out: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing work_summary', () => {
    const { work_summary: _, ...rest } = validPayload;
    const result = HandoverPayloadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects negative mileage_out', () => {
    const result = HandoverPayloadSchema.safeParse({
      ...validPayload,
      mileage_out: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects float mileage_out', () => {
    const result = HandoverPayloadSchema.safeParse({
      ...validPayload,
      mileage_out: 100.5,
    });
    expect(result.success).toBe(false);
  });

  it('defaults gallery_consent to false', () => {
    const result = HandoverPayloadSchema.parse({
      work_summary: 'Test',
      mileage_out: 0,
    });
    expect(result.gallery_consent).toBe(false);
  });

  it('defaults items_returned to empty array', () => {
    const result = HandoverPayloadSchema.parse({
      work_summary: 'Test',
      mileage_out: 0,
    });
    expect(result.items_returned).toEqual([]);
  });

  it('defaults warranty_text to empty string', () => {
    const result = HandoverPayloadSchema.parse({
      work_summary: 'Test',
      mileage_out: 0,
    });
    expect(result.warranty_text).toBe('');
  });
});
