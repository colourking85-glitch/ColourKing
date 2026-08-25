import { z } from 'zod';

export const DocumentSchema = z.object({
  doc_type: z.enum(['offer', 'repair_order', 'handover_note', 'invoice', 'credit_note']),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  offer_id: z.string().uuid().nullable().optional(),
  invoice_id: z.string().uuid().nullable().optional(),
  supersedes_id: z.string().uuid().nullable().optional(),
  locale: z.string().default('nl'),
  payload: z.record(z.unknown()).nullable().optional(),
});

export const IssueDocumentSchema = z.object({
  id: z.string().uuid(),
  payload: z.record(z.unknown()),
});

export const CancelDocumentSchema = z.object({
  id: z.string().uuid(),
  cancel_reason: z.string().min(1),
});

export type DocumentInput = z.infer<typeof DocumentSchema>;
export type IssueDocumentInput = z.infer<typeof IssueDocumentSchema>;
export type CancelDocumentInput = z.infer<typeof CancelDocumentSchema>;
