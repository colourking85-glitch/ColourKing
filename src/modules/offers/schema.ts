import { z } from 'zod';

export const OfferSchema = z.object({
  type: z.enum(['offer', 'supplement']).default('offer'),
  origin: z.enum(['website', 'manual', 'phone', 'email', 'walk_in']).default('manual'),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional(),
  lead_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  parent_offer_id: z.string().uuid().nullable().optional(),
  supersedes_id: z.string().uuid().nullable().optional(),
  locale: z.string().default('nl'),
  valid_until: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const OfferLineSchema = z.object({
  kind: z.enum(['labour', 'part', 'material', 'other']).default('labour'),
  description: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unit: z.string().default('st'),
  unit_price_cents: z.number().int().min(0).default(0),
  discount_pct: z.number().min(0).max(100).default(0),
  tax_code: z.enum(['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX']).default('H21'),
  part_number: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const ApproveOfferSchema = z.object({
  id: z.string().uuid(),
  approved_by_name: z.string().min(1),
});

export const RejectOfferSchema = z.object({
  id: z.string().uuid(),
  rejected_reason: z.string().min(1),
});

export type OfferInput = z.infer<typeof OfferSchema>;
export type OfferLineInput = z.infer<typeof OfferLineSchema>;
export type ApproveOfferInput = z.infer<typeof ApproveOfferSchema>;
export type RejectOfferInput = z.infer<typeof RejectOfferSchema>;
