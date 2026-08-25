import { z } from 'zod';

export const PURCHASE_CATEGORIES = [
  'general',
  'parts',
  'paint',
  'materials',
  'tools',
  'rent',
  'utilities',
  'insurance',
  'other',
] as const;

export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];

export const TAX_CODES = ['H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX'] as const;

export const PAYMENT_METHODS = ['ideal', 'bank_transfer', 'cash', 'card', 'mollie'] as const;

export const TAX_RATES: Record<string, number> = {
  H21: 21,
  L9: 9,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

export function calcVatCents(subtotalCents: number, taxCode: string): number {
  const rate = TAX_RATES[taxCode] ?? 0;
  return Math.round(subtotalCents * rate / 100);
}

export function calcTotalCents(subtotalCents: number, vatCents: number): number {
  return subtotalCents + vatCents;
}

export const PurchaseSchema = z.object({
  supplier_name: z.string().min(1),
  supplier_vat_number: z.string().nullable().optional(),
  invoice_date: z.string().min(1),
  due_date: z.string().nullable().optional(),
  subtotal_cents: z.number().int().min(0),
  tax_code: z.enum(TAX_CODES).default('H21'),
  category: z.enum(PURCHASE_CATEGORIES).default('general'),
  description: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
});

export const PurchaseUpdateSchema = PurchaseSchema.partial();

export const PurchaseFilterSchema = z.object({
  category: z.enum(PURCHASE_CATEGORIES).optional(),
  paid: z.enum(['all', 'paid', 'unpaid']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  supplier: z.string().optional(),
});

export const MarkPaidSchema = z.object({
  payment_method: z.enum(PAYMENT_METHODS),
  paid_at: z.string().optional(),
});

export type PurchaseInput = z.infer<typeof PurchaseSchema>;
export type PurchaseUpdateInput = z.infer<typeof PurchaseUpdateSchema>;
export type PurchaseFilterInput = z.infer<typeof PurchaseFilterSchema>;
export type MarkPaidInput = z.infer<typeof MarkPaidSchema>;
