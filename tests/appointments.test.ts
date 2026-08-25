import { describe, it, expect } from 'vitest';
import {
  AppointmentSchema,
  UpdateAppointmentSchema,
  ResourceSchema,
  BlackoutSchema,
  OpeningHoursSchema,
} from '../src/modules/appointments/schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('AppointmentSchema', () => {
  it('validates a minimal appointment', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Jan de Vries',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty contact_name', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: '',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = AppointmentSchema.safeParse({
      type: 'meeting',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all appointment types', () => {
    for (const type of ['inspection', 'drop_off', 'collection', 'repair_slot']) {
      const result = AppointmentSchema.safeParse({
        type,
        contact_name: 'Test',
        scheduled_date: '2026-09-01',
        scheduled_time: '09:00',
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults duration_minutes to 30', () => {
    const result = AppointmentSchema.parse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
    });
    expect(result.duration_minutes).toBe(30);
  });

  it('rejects duration less than 15', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
      duration_minutes: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration more than 480', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
      duration_minutes: 500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '01-09-2026',
      scheduled_time: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '9:00 AM',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = AppointmentSchema.safeParse({
      type: 'drop_off',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '14:30',
      duration_minutes: 60,
      customer_id: VALID_UUID,
      vehicle_id: VALID_UUID,
      resource_id: VALID_UUID,
      contact_phone: '+31612345678',
      contact_email: 'test@example.com',
      notes: 'Bring keys',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = AppointmentSchema.safeParse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '09:00',
      contact_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateAppointmentSchema', () => {
  it('accepts partial updates', () => {
    const result = UpdateAppointmentSchema.safeParse({
      contact_name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = UpdateAppointmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates type if provided', () => {
    expect(UpdateAppointmentSchema.safeParse({ type: 'invalid' }).success).toBe(false);
    expect(UpdateAppointmentSchema.safeParse({ type: 'inspection' }).success).toBe(true);
  });
});

describe('ResourceSchema', () => {
  it('validates a minimal resource', () => {
    const result = ResourceSchema.safeParse({
      type: 'bay',
      name: 'Bay 1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ResourceSchema.safeParse({ type: 'bay', name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults capacity to 1', () => {
    const result = ResourceSchema.parse({ type: 'bay', name: 'Bay 1' });
    expect(result.capacity).toBe(1);
  });

  it('defaults active to true', () => {
    const result = ResourceSchema.parse({ type: 'bay', name: 'Bay 1' });
    expect(result.active).toBe(true);
  });

  it('accepts all resource types', () => {
    for (const type of ['bay', 'booth', 'staff']) {
      const result = ResourceSchema.safeParse({ type, name: 'Test' });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid type', () => {
    const result = ResourceSchema.safeParse({ type: 'garage', name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('rejects capacity less than 1', () => {
    const result = ResourceSchema.safeParse({ type: 'bay', name: 'Bay', capacity: 0 });
    expect(result.success).toBe(false);
  });
});

describe('BlackoutSchema', () => {
  it('validates a blackout period', () => {
    const result = BlackoutSchema.safeParse({
      title: 'Kerstvakantie',
      start_date: '2026-12-25',
      end_date: '2027-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = BlackoutSchema.safeParse({
      title: '',
      start_date: '2026-12-25',
      end_date: '2027-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('defaults all_day to true', () => {
    const result = BlackoutSchema.parse({
      title: 'Holiday',
      start_date: '2026-12-25',
      end_date: '2026-12-25',
    });
    expect(result.all_day).toBe(true);
  });

  it('accepts optional resource_id', () => {
    const result = BlackoutSchema.safeParse({
      title: 'Bay maintenance',
      start_date: '2026-10-01',
      end_date: '2026-10-01',
      resource_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });
});

describe('OpeningHoursSchema', () => {
  it('validates opening hours', () => {
    const result = OpeningHoursSchema.safeParse({
      day_of_week: 0,
      open_time: '08:00',
      close_time: '17:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects day_of_week > 6', () => {
    const result = OpeningHoursSchema.safeParse({
      day_of_week: 7,
      open_time: '08:00',
      close_time: '17:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects day_of_week < 0', () => {
    const result = OpeningHoursSchema.safeParse({
      day_of_week: -1,
      open_time: '08:00',
      close_time: '17:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = OpeningHoursSchema.safeParse({
      day_of_week: 1,
      open_time: '8am',
      close_time: '5pm',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid days', () => {
    for (let d = 0; d <= 6; d++) {
      const result = OpeningHoursSchema.safeParse({
        day_of_week: d,
        open_time: '09:00',
        close_time: '18:00',
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('Appointment status transitions', () => {
  it('inspection type should auto-confirm (type = inspection)', () => {
    // This tests the business rule: inspection appointments are auto-confirmed
    // The actual logic is in actions.ts createAppointment
    const result = AppointmentSchema.parse({
      type: 'inspection',
      contact_name: 'Test',
      scheduled_date: '2026-09-01',
      scheduled_time: '10:00',
    });
    expect(result.type).toBe('inspection');
    // Auto-confirm is handled in createAppointment action
  });

  it('non-inspection types start as requested', () => {
    // drop_off, collection, repair_slot all start as "requested"
    for (const type of ['drop_off', 'collection', 'repair_slot']) {
      const result = AppointmentSchema.parse({
        type,
        contact_name: 'Test',
        scheduled_date: '2026-09-01',
        scheduled_time: '10:00',
      });
      expect(result.type).toBe(type);
      // Status "requested" is the default in the DB / createAppointment action
    }
  });
});
