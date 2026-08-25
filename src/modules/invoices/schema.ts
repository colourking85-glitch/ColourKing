import { z } from 'zod';

export const InvoiceSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  offer_id: z.string().uuid().nullable().optional(),
  locale: z.string().default('nl'),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
});

export const InvoiceLineSchema = z.object({
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

export const CreateInvoiceFromOfferSchema = z.object({
  offer_id: z.string().uuid(),
  due_date: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
});

export const IssueInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const CreateCreditNoteSchema = z.object({
  invoice_id: z.string().uuid(),
  reason: z.string().min(1),
});

export const RecordPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount_cents: z.number().int().min(1),
  method: z.enum(['ideal', 'bank_transfer', 'cash', 'card', 'mollie']),
  reference: z.string().nullable().optional(),
  mollie_payment_id: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type InvoiceLineInput = z.infer<typeof InvoiceLineSchema>;
export type CreateInvoiceFromOfferInput = z.infer<typeof CreateInvoiceFromOfferSchema>;
export type IssueInvoiceInput = z.infer<typeof IssueInvoiceSchema>;
export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
