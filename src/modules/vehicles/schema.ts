import { z } from 'zod';

export const VehicleSchema = z.object({
  customer_id: z.string().uuid(),
  kenteken: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  colour: z.string().nullable().optional(),
  paint_code: z.string().nullable().optional(),
  fuel: z.string().nullable().optional(),
  body_type: z.string().nullable().optional(),
  rdw_snapshot: z.record(z.unknown()).nullable().optional(),
  wok: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  plate_origin: z.string().nullable().optional(),
  // Customer 360 ownership fields (migration 0059)
  ownership: z.enum(['owned', 'leased', 'rental', 'unknown']).nullable().optional(),
  lease_company_id: z.string().uuid().nullable().optional(),
  insurer_id: z.string().uuid().nullable().optional(),
  driver_contact_id: z.string().uuid().nullable().optional(),
});

export type VehicleInput = z.infer<typeof VehicleSchema>;
