import { z } from 'zod';

export const VatReturnSchema = z.object({
  period_type: z.enum(['quarter', 'month']).default('quarter'),
  year: z.number().int().min(2000).max(2100),
  period: z.number().int().min(1).max(12),
  status: z.enum(['open', 'draft', 'filed', 'corrected']).optional(),
  box1a_supplies_high: z.number().int().default(0),
  box1b_supplies_low: z.number().int().default(0),
  box1c_supplies_other: z.number().int().default(0),
  box1d_private_use: z.number().int().default(0),
  box1e_supplies_zero: z.number().int().default(0),
  box2a_supplies_from_eu: z.number().int().default(0),
  box4a_vat_on_supplies: z.number().int().default(0),
  box4b_vat_on_eu: z.number().int().default(0),
  box5a_vat_deductible: z.number().int().default(0),
  box5b_vat_balance: z.number().int().default(0),
  box5c_small_business: z.number().int().default(0),
  box5d_estimate_previous: z.number().int().default(0),
  box5e_total_payable: z.number().int().default(0),
  box5f_total_refund: z.number().int().default(0),
  notes: z.string().nullable().optional(),
});

export const CalculateVatSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  period: z.number().int().min(1).max(12),
  period_type: z.enum(['quarter', 'month']).default('quarter'),
});

export const FileVatReturnSchema = z.object({
  id: z.string().uuid(),
});

export type VatReturnInput = z.infer<typeof VatReturnSchema>;
export type CalculateVatInput = z.infer<typeof CalculateVatSchema>;
export type FileVatReturnInput = z.infer<typeof FileVatReturnSchema>;
