import { z } from 'zod';

export const LeadSchema = z.object({
  contact_name: z.string().min(1, 'Naam is verplicht'),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  kenteken: z.string().nullable().optional(),
  damage_description: z.string().nullable().optional(),
  preferred_date: z.string().nullable().optional(),
  origin: z.string().default('website'),
  channel: z.string().nullable().optional(),
  locale: z.enum(['nl', 'en', 'tr']).default('nl'),
  status: z.enum(['new', 'contacted', 'quoted', 'won', 'lost']).default('new'),
  lost_reason: z.string().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
