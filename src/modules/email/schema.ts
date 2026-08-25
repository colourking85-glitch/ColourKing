import { z } from 'zod';

export const EmailTemplateName = z.enum([
  'offerSent',
  'invoiceSent',
  'appointmentConfirmed',
  'appointmentReminder',
  'paymentReceived',
  'leadReceived',
  'repairOrderReady',
]);

export type EmailTemplateName = z.infer<typeof EmailTemplateName>;

export const EmailLocale = z.enum(['nl', 'en', 'tr']);
export type EmailLocale = z.infer<typeof EmailLocale>;

/* ── Per-template data schemas ─────────────────────────────── */

export const OfferSentData = z.object({
  customerName: z.string(),
  offerNumber: z.string(),
  validUntil: z.string().nullable().optional(),
  lines: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      lineTotalCents: z.number().int(),
    }),
  ),
  subtotalCents: z.number().int(),
  vatCents: z.number().int(),
  totalCents: z.number().int(),
  approveUrl: z.string().url(),
  rejectUrl: z.string().url(),
});

export const InvoiceSentData = z.object({
  customerName: z.string(),
  invoiceNumber: z.string(),
  issuedAt: z.string(),
  dueDate: z.string().nullable().optional(),
  subtotalCents: z.number().int(),
  vatCents: z.number().int(),
  totalCents: z.number().int(),
  payUrl: z.string().url().nullable().optional(),
});

export const AppointmentConfirmedData = z.object({
  customerName: z.string(),
  appointmentType: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  durationMinutes: z.number().int(),
  address: z.string(),
  vehicleInfo: z.string().nullable().optional(),
  cancelUrl: z.string().url().nullable().optional(),
});

export const AppointmentReminderData = z.object({
  customerName: z.string(),
  appointmentType: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  address: z.string(),
  vehicleInfo: z.string().nullable().optional(),
  cancelUrl: z.string().url().nullable().optional(),
});

export const PaymentReceivedData = z.object({
  customerName: z.string(),
  invoiceNumber: z.string(),
  amountCents: z.number().int(),
  paidAt: z.string(),
  method: z.string(),
});

export const LeadReceivedData = z.object({
  contactName: z.string(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  kenteken: z.string().nullable().optional(),
  damageDescription: z.string().nullable().optional(),
  origin: z.string(),
  leadUrl: z.string().url(),
});

export const RepairOrderReadyData = z.object({
  customerName: z.string(),
  vehicleInfo: z.string(),
  jobNumber: z.string().nullable().optional(),
  collectionDate: z.string().nullable().optional(),
  collectionTime: z.string().nullable().optional(),
  address: z.string(),
});

/* ── Template data union ──────────────────────────────────── */

export const TemplateDataMap = {
  offerSent: OfferSentData,
  invoiceSent: InvoiceSentData,
  appointmentConfirmed: AppointmentConfirmedData,
  appointmentReminder: AppointmentReminderData,
  paymentReceived: PaymentReceivedData,
  leadReceived: LeadReceivedData,
  repairOrderReady: RepairOrderReadyData,
} as const;

export type TemplateDataMap = {
  [K in EmailTemplateName]: z.infer<(typeof TemplateDataMap)[K]>;
};

/* ── Send email request schema ────────────────────────────── */

export const SendEmailRequestSchema = z.object({
  template: EmailTemplateName,
  to: z.string().email(),
  locale: EmailLocale.default('nl'),
  data: z.record(z.unknown()),
});

export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

/* ── Email log entry ──────────────────────────────────────── */

export const EmailLogSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  template: EmailTemplateName,
  locale: EmailLocale,
  ref_type: z.string().nullable().optional(),
  ref_id: z.string().uuid().nullable().optional(),
  status: z.enum(['sent', 'failed', 'dry_run']),
  error: z.string().nullable().optional(),
});

export type EmailLogInput = z.infer<typeof EmailLogSchema>;
