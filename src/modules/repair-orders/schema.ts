import { z } from 'zod';

/**
 * Payload frozen into a repair_order document upon issuing.
 */
export const RepairOrderPayloadSchema = z.object({
  // Vehicle
  kenteken: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().nullable().optional(),
  colour: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  mileage_in: z.number().int().min(0).nullable().optional(),

  // Existing damage
  existing_damage: z.string().default(''),

  // Work
  work_description: z.string().min(1),
  estimated_total_cents: z.number().int().min(0),

  // Terms
  terms_accepted: z.boolean(),

  // Customer
  customer_name: z.string().min(1),
  customer_address: z.string().nullable().optional(),
  customer_phone: z.string().nullable().optional(),
  customer_email: z.string().email().nullable().optional(),
});

/**
 * Payload frozen into a handover_note document upon issuing.
 */
export const HandoverPayloadSchema = z.object({
  work_summary: z.string().min(1),
  mileage_out: z.number().int().min(0),
  warranty_text: z.string().default(''),
  gallery_consent: z.boolean().default(false),
  items_returned: z.array(z.string()).default([]),
});

export type RepairOrderPayload = z.infer<typeof RepairOrderPayloadSchema>;
export type HandoverPayload = z.infer<typeof HandoverPayloadSchema>;
