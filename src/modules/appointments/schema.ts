import { z } from 'zod';

export const AppointmentSchema = z.object({
  type: z.enum(['inspection', 'drop_off', 'collection', 'repair_slot']),
  customer_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  resource_id: z.string().uuid().nullable().optional(),
  contact_name: z.string().min(1),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().int().min(15).max(480).default(30),
  notes: z.string().nullable().optional(),
});

export const UpdateAppointmentSchema = z.object({
  type: z.enum(['inspection', 'drop_off', 'collection', 'repair_slot']).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  resource_id: z.string().uuid().nullable().optional(),
  contact_name: z.string().min(1).optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_minutes: z.number().int().min(15).max(480).optional(),
  notes: z.string().nullable().optional(),
});

export const ResourceSchema = z.object({
  type: z.enum(['bay', 'booth', 'staff']),
  name: z.string().min(1),
  capacity: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
});

export const BlackoutSchema = z.object({
  title: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  all_day: z.boolean().default(true),
  resource_id: z.string().uuid().nullable().optional(),
});

export const OpeningHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type AppointmentInput = z.infer<typeof AppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type ResourceInput = z.infer<typeof ResourceSchema>;
export type BlackoutInput = z.infer<typeof BlackoutSchema>;
export type OpeningHoursInput = z.infer<typeof OpeningHoursSchema>;
