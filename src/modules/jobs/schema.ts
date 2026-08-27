import { z } from 'zod';

export const JobSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  lead_id: z.string().uuid().nullable().optional(),
  offer_id: z.string().uuid().nullable().optional(),
  stage: z
    .enum([
      'intake',
      'quoted',
      'approved',
      'scheduled',
      'checked_in',
      'in_progress',
      'qc',
      'ready',
      'delivered',
      'closed',
    ])
    .default('intake'),
  assigned_to: z.string().uuid().nullable().optional(),
  intake_km: z.number().int().positive().nullable().optional(),
  outtake_km: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  job_type: z.enum(['bodywork', 'mechanical', 'paint', 'electrical', 'diagnostics', 'apk', 'maintenance']).default('bodywork'),
  priority: z.enum(['normal', 'urgent', 'rush']).default('normal'),
  payer_type: z.enum(['casco', 'wa', 'particulier', 'lease']).nullable().optional(),
  estimated_hours: z.number().positive().nullable().optional(),
  target_date: z.string().nullable().optional(),
});

export type JobInput = z.infer<typeof JobSchema>;

export const JobEventSchema = z.object({
  job_id: z.string().uuid(),
  event_type: z.enum([
    'stage_change',
    'note',
    'photo_added',
    'part_ordered',
    'part_received',
    'task_completed',
    'document_issued',
    'payment_received',
    'assignment_change',
  ]),
  from_stage: z.string().nullable().optional(),
  to_stage: z.string().nullable().optional(),
  payload: z.record(z.unknown()).nullable().optional(),
  note: z.string().nullable().optional(),
});

export type JobEventInput = z.infer<typeof JobEventSchema>;
