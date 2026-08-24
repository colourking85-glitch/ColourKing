import { z } from 'zod';

export const CustomerSchema = z.object({
  type: z.enum(['private', 'company', 'fleet', 'dealer']).default('private'),
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  btw_number: z.string().nullable().optional(),
  locale: z.enum(['nl', 'en', 'tr']).default('nl'),
  notes: z.string().nullable().optional(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
