import { z } from 'zod';

export const EmailTemplateName = z.enum([
  'offerSent',
  'offerExpiring',
  'invoiceSent',
  'invoiceDueSoon',
  'invoiceOverdue',
  'appointmentConfirmed',
  'appointmentReminder',
  'paymentReceived',
  'leadReceived',
  'vehicleReady',
  'handoverShare',
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
  leadNumber: z.number().nullable().optional(),
  appointmentType: z.string().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  locationAddress: z.string().nullable().optional(),
});

export const VehicleReadyData = z.object({
  customerName: z.string(),
  vehicleInfo: z.string(),
  jobNumber: z.string().nullable().optional(),
  collectionDate: z.string().nullable().optional(),
  collectionTime: z.string().nullable().optional(),
  address: z.string(),
  openingHours: z.string().nullable().optional(),
});

export const OfferExpiringData = z.object({
  customerName: z.string(),
  offerNumber: z.string(),
  validUntil: z.string(),
  totalCents: z.number().int(),
  contactUrl: z.string().url(),
});

export const InvoiceDueSoonData = z.object({
  customerName: z.string(),
  invoiceNumber: z.string(),
  dueDate: z.string(),
  totalCents: z.number().int(),
  payUrl: z.string().url().nullable().optional(),
  iban: z.string(),
});

export const InvoiceOverdueData = InvoiceDueSoonData.extend({
  daysOverdue: z.number().int(),
});

export const HandoverShareData = z.object({
  customerName: z.string(),
  docNumber: z.string(),
  vehicleInfo: z.string().nullable().optional(),
  signUrl: z.string().url(),
});

/* ── Template data union ──────────────────────────────────── */

export const TemplateDataMap = {
  offerSent: OfferSentData,
  offerExpiring: OfferExpiringData,
  invoiceSent: InvoiceSentData,
  invoiceDueSoon: InvoiceDueSoonData,
  invoiceOverdue: InvoiceOverdueData,
  appointmentConfirmed: AppointmentConfirmedData,
  appointmentReminder: AppointmentReminderData,
  paymentReceived: PaymentReceivedData,
  leadReceived: LeadReceivedData,
  vehicleReady: VehicleReadyData,
  handoverShare: HandoverShareData,
} as const;

export type TemplateDataMap = {
  [K in EmailTemplateName]: z.infer<(typeof TemplateDataMap)[K]>;
};

/* ── Send email request schema ────────────────────────────── */

export const EmailPurposeSchema = z.enum(['default', 'offers', 'invoices', 'appointments', 'workshop', 'leads']);

export const SendEmailRequestSchema = z.object({
  template: EmailTemplateName,
  to: z.string().email(),
  locale: EmailLocale.default('nl'),
  data: z.record(z.unknown()),
  purpose: EmailPurposeSchema.optional(),
});

/* ── Settings: sender identities + reminder rules ─────────── */

export const EmailIdentitySchema = z.object({
  from_name: z.string().max(80).default(''),
  from_email: z.string().email().or(z.literal('')).default(''),
  reply_to: z.string().email().or(z.literal('')).default(''),
  bcc: z.string().email().or(z.literal('')).default(''),
  enabled: z.boolean().default(true),
});

export const EmailIdentitiesSchema = z.object({
  default: EmailIdentitySchema,
  offers: EmailIdentitySchema,
  invoices: EmailIdentitySchema,
  appointments: EmailIdentitySchema,
  workshop: EmailIdentitySchema,
  leads: EmailIdentitySchema,
});

const daysBefore = z.number().int().min(0).max(60);

export const ReminderSettingsSchema = z.object({
  invoice_due_soon:     z.object({ enabled: z.boolean(), days_before: daysBefore, sender: EmailPurposeSchema }),
  invoice_overdue:      z.object({ enabled: z.boolean(), days_after: daysBefore, auto_mark_overdue: z.boolean(), sender: EmailPurposeSchema }),
  offer_expiring:       z.object({ enabled: z.boolean(), days_before: daysBefore, sender: EmailPurposeSchema }),
  appointment_reminder: z.object({ enabled: z.boolean(), days_before: daysBefore, sender: EmailPurposeSchema }),
  vehicle_ready:        z.object({ enabled: z.boolean(), sender: EmailPurposeSchema }),
  max_per_run: z.number().int().min(1).max(1000),
});

export type ReminderSettings = z.infer<typeof ReminderSettingsSchema>;

export const REMINDER_DEFAULTS: ReminderSettings = {
  invoice_due_soon:     { enabled: true, days_before: 2, sender: 'invoices' },
  invoice_overdue:      { enabled: true, days_after: 2, auto_mark_overdue: true, sender: 'invoices' },
  offer_expiring:       { enabled: true, days_before: 2, sender: 'offers' },
  appointment_reminder: { enabled: true, days_before: 1, sender: 'appointments' },
  vehicle_ready:        { enabled: true, sender: 'workshop' },
  max_per_run: 200,
};

export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

/* ── Email log entry ──────────────────────────────────────── */

export const EmailLogSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  template: EmailTemplateName.or(z.literal('test')),
  locale: EmailLocale,
  ref_type: z.string().nullable().optional(),
  ref_id: z.string().uuid().nullable().optional(),
  status: z.enum(['sent', 'failed', 'dry_run']),
  error: z.string().nullable().optional(),
});

export type EmailLogInput = z.infer<typeof EmailLogSchema>;
