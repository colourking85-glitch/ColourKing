import { z } from 'zod';

export const PartSchema = z.object({
  job_id: z.string().uuid(),
  offer_line_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  part_number: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  unit_price_cents: z.number().int().min(0).default(0),
  blocking: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const UpdatePartSchema = z.object({
  description: z.string().min(1).optional(),
  part_number: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  unit_price_cents: z.number().int().min(0).optional(),
  blocking: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

const PART_STATUSES = ['needed', 'ordered', 'shipped', 'received', 'returned'] as const;

export const PartStatusSchema = z.object({
  status: z.enum(PART_STATUSES),
});

export type PartInput = z.infer<typeof PartSchema>;
export type UpdatePartInput = z.infer<typeof UpdatePartSchema>;
export type PartStatusInput = z.infer<typeof PartStatusSchema>;
