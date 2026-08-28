import { z } from 'zod';

export const InspectionSchema = z.object({
  vehicle_id: z.string().uuid().nullable().optional(),
  plate_country: z.string().length(2).default('NL'),
  paint_code: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  parent_inspection_id: z.string().uuid().nullable().optional(),
  purpose: z.enum(['particulier', 'verzekering', 'intern']).default('particulier'),
  licence_plate: z.string().min(1),
  vin: z.string().nullable().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  first_reg_date: z.string().nullable().optional(),
  fuel: z.string().nullable().optional(),
  odometer_km: z.number().int().nullable().optional(),
  rdw_verified: z.boolean().default(false),
  rdw_payload: z.any().nullable().optional(),
  event_date: z.string().nullable().optional(),
  event_description: z.string().nullable().optional(),
  insurer_name: z.string().nullable().optional(),
  claim_number: z.string().nullable().optional(),
});

export const FindingSchema = z.object({
  id: z.string().uuid(),
  inspection_id: z.string().uuid(),
  component_key: z.string().min(1),
  hotspot_point: z.object({ x: z.number(), y: z.number() }).nullable().optional(),
  sub_location: z.string().nullable().optional(),
  damage_types: z.array(z.string()).default([]),
  severity: z.number().int().min(1).max(4).default(2),
  origin: z.enum(['schade', 'pre_existent']).default('schade'),
  disposition: z.enum(['herstellen', 'vervangen', 'onderzoeken', 'geen_actie']).default('herstellen'),
  repair_hours: z.number().min(0).default(0),
  repair_technique: z.enum(['uitdeuken', 'uitdeuken_plamuren', 'richten', 'vervangen', 'demontage_montage', 'polijsten', 'nader_onderzoeken']).nullable().optional(),
  paint_required: z.boolean().default(false),
  paint_operation: z.enum(['spot', 'paneel', 'inspuiten', 'polijsten', 'paneel_inspuiten', 'polijsten_lak']).nullable().optional(),
  paint_hours: z.number().min(0).default(0),
  blend_components: z.array(z.string()).default([]),
  hidden_damage_possible: z.boolean().default(false),
  hidden_damage_note: z.string().nullable().optional(),
  adas_possible: z.boolean().default(false),
  description: z.string().nullable().optional(),
});

export const FindingPartSchema = z.object({
  finding_id: z.string().uuid(),
  inspection_id: z.string().uuid(),
  description: z.string().min(1),
  part_number: z.string().nullable().optional(),
  qty: z.number().min(0).default(1),
  unit_price_cents: z.number().int().nullable().optional(),
  source: z.enum(['nieuw', 'gebruikt', 'imitatie']).default('nieuw'),
});

export type InspectionInput = z.infer<typeof InspectionSchema>;
export type FindingInput = z.infer<typeof FindingSchema>;
export type FindingPartInput = z.infer<typeof FindingPartSchema>;
