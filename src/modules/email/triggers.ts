/**
 * Email trigger functions for business events.
 * Each function fetches required data from the database,
 * renders the appropriate template, and sends the email.
 *
 * These are meant to be called from existing API routes / server actions
 * when the corresponding event occurs. Not wired up yet — just the functions.
 */

import { createClient } from '@/lib/supabase/server';
import { renderTemplate, getSubject } from './templates';
import { sendEmail } from './sender';
import { logEmail } from './log';
import type { EmailLocale } from './schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://colourking.nl';

function validLocale(locale: string | null | undefined): EmailLocale {
  if (locale === 'en' || locale === 'tr') return locale;
  return 'nl';
}

/**
 * Send offer email to customer when an offer is sent.
 */
export async function onOfferSent(offerId: string): Promise<void> {
  const supabase = createClient();

  const { data: offer, error } = await supabase
    .from('offers')
    .select('*, customers(*), offer_lines(*)')
    .eq('id', offerId)
    .single();

  if (error || !offer) {
    console.error('[EMAIL TRIGGER] onOfferSent: offer not found', offerId);
    return;
  }

  const customer = offer.customers as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onOfferSent: customer has no email');
    return;
  }

  const locale = validLocale(customer.locale as string);
  const lines = (offer.offer_lines as Array<Record<string, unknown>>) ?? [];

  const data = {
    customerName: String(customer.name ?? ''),
    offerNumber: offer.offer_number ?? offerId.slice(0, 8),
    validUntil: offer.valid_until,
    lines: lines.map((l) => ({
      description: String(l.description ?? ''),
      quantity: Number(l.quantity ?? 1),
      unit: String(l.unit ?? 'st'),
      lineTotalCents: Number(l.line_total_cents ?? 0),
    })),
    subtotalCents: offer.subtotal_cents,
    vatCents: offer.vat_cents,
    totalCents: offer.total_cents,
    approveUrl: `${APP_URL}/offerte/${offerId}/approve`,
    rejectUrl: `${APP_URL}/offerte/${offerId}/reject`,
  };

  const html = renderTemplate('offerSent', data, locale);
  const subject = getSubject('offerSent', data, locale);
  const to = String(customer.email);

  const result = await sendEmail(to, subject, html);

  await logEmail({
    to,
    subject,
    template: 'offerSent',
    locale,
    ref_type: 'offer',
    ref_id: offerId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
  });
}

/**
 * Send invoice email with payment link when an invoice is issued.
 */
export async function onInvoiceIssued(invoiceId: string): Promise<void> {
  const supabase = createClient();

  // invoices is stored via documents + offers — query the relevant data
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*, customers(*)')
    .eq('invoice_id', invoiceId)
    .eq('doc_type', 'invoice')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !doc) {
    console.error('[EMAIL TRIGGER] onInvoiceIssued: document not found', invoiceId);
    return;
  }

  const customer = doc.customers as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onInvoiceIssued: customer has no email');
    return;
  }

  const locale = validLocale(customer.locale as string);
  const payload = (doc.payload ?? {}) as Record<string, unknown>;

  const data = {
    customerName: String(customer.name ?? ''),
    invoiceNumber: doc.doc_number ?? invoiceId.slice(0, 8),
    issuedAt: doc.issued_at ?? new Date().toISOString(),
    dueDate: (payload.due_date as string) ?? null,
    subtotalCents: Number(payload.subtotal_cents ?? 0),
    vatCents: Number(payload.vat_cents ?? 0),
    totalCents: Number(payload.total_cents ?? 0),
    payUrl: payload.payment_token
      ? `${APP_URL}/pay/${String(payload.payment_token)}`
      : null,
  };

  const html = renderTemplate('invoiceSent', data, locale);
  const subject = getSubject('invoiceSent', data, locale);
  const to = String(customer.email);

  const result = await sendEmail(to, subject, html);

  await logEmail({
    to,
    subject,
    template: 'invoiceSent',
    locale,
    ref_type: 'invoice',
    ref_id: invoiceId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
  });
}

/**
 * Send appointment confirmation email.
 */
export async function onAppointmentConfirmed(appointmentId: string): Promise<void> {
  const supabase = createClient();

  const { data: apt, error } = await supabase
    .from('appointments')
    .select('*, customers(*), vehicles(*)')
    .eq('id', appointmentId)
    .single();

  if (error || !apt) {
    console.error('[EMAIL TRIGGER] onAppointmentConfirmed: not found', appointmentId);
    return;
  }

  const email = apt.contact_email;
  const customer = apt.customers as Record<string, unknown> | null;
  const vehicle = apt.vehicles as Record<string, unknown> | null;
  const to = email ?? (customer?.email as string) ?? null;

  if (!to) {
    console.warn('[EMAIL TRIGGER] onAppointmentConfirmed: no email address');
    return;
  }

  const locale = validLocale(customer?.locale as string);

  const vehicleInfo = vehicle
    ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim()
    : null;

  const data = {
    customerName: apt.contact_name ?? String(customer?.name ?? ''),
    appointmentType: apt.type,
    scheduledDate: apt.scheduled_date,
    scheduledTime: apt.scheduled_time,
    durationMinutes: apt.duration_minutes,
    address: 'Satijnbloem 6, 3068 JP Rotterdam',
    vehicleInfo,
    cancelUrl: `${APP_URL}/afspraak/${appointmentId}/cancel`,
  };

  const html = renderTemplate('appointmentConfirmed', data, locale);
  const subject = getSubject('appointmentConfirmed', data, locale);

  const result = await sendEmail(to, subject, html);

  await logEmail({
    to,
    subject,
    template: 'appointmentConfirmed',
    locale,
    ref_type: 'appointment',
    ref_id: appointmentId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
  });
}

/**
 * Send payment confirmation email.
 */
export async function onPaymentReceived(paymentId: string): Promise<void> {
  const supabase = createClient();

  // Payment data is stored as a job_event or via the invoices flow
  // For now, we look up via the document payload
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*, customers(*)')
    .eq('doc_type', 'invoice')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !doc?.length) {
    console.error('[EMAIL TRIGGER] onPaymentReceived: no invoices found');
    return;
  }

  // Find the document whose payload references this payment
  const matched = doc.find((d) => {
    const p = (d.payload ?? {}) as Record<string, unknown>;
    return p.payment_id === paymentId || d.id === paymentId;
  });

  if (!matched) {
    console.error('[EMAIL TRIGGER] onPaymentReceived: payment not matched', paymentId);
    return;
  }

  const customer = matched.customers as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onPaymentReceived: customer has no email');
    return;
  }

  const locale = validLocale(customer.locale as string);
  const payload = (matched.payload ?? {}) as Record<string, unknown>;

  const data = {
    customerName: String(customer.name ?? ''),
    invoiceNumber: matched.doc_number ?? '',
    amountCents: Number(payload.total_cents ?? 0),
    paidAt: new Date().toISOString(),
    method: 'iDEAL',
  };

  const html = renderTemplate('paymentReceived', data, locale);
  const subject = getSubject('paymentReceived', data, locale);
  const to = String(customer.email);

  const result = await sendEmail(to, subject, html);

  await logEmail({
    to,
    subject,
    template: 'paymentReceived',
    locale,
    ref_type: 'payment',
    ref_id: paymentId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
  });
}

/**
 * Send internal notification to staff about a new lead.
 */
export async function onLeadCreated(leadId: string): Promise<void> {
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    console.error('[EMAIL TRIGGER] onLeadCreated: not found', leadId);
    return;
  }

  // Send to all admin/office staff
  const { data: staff } = await supabase
    .from('staff')
    .select('email, locale')
    .in('role', ['admin', 'office'])
    .eq('active', true);

  if (!staff?.length) {
    console.warn('[EMAIL TRIGGER] onLeadCreated: no staff to notify');
    return;
  }

  const data = {
    contactName: lead.contact_name,
    contactEmail: lead.contact_email,
    contactPhone: lead.contact_phone,
    kenteken: lead.kenteken,
    damageDescription: lead.damage_description,
    origin: lead.origin,
    leadUrl: `${APP_URL}/app/leads/${leadId}`,
  };

  for (const member of staff) {
    const locale = validLocale(member.locale);
    const html = renderTemplate('leadReceived', data, locale);
    const subject = getSubject('leadReceived', data, locale);

    const result = await sendEmail(member.email, subject, html);

    await logEmail({
      to: member.email,
      subject,
      template: 'leadReceived',
      locale,
      ref_type: 'lead',
      ref_id: leadId,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
    });
  }
}

/**
 * Send "your car is ready" email when repair is complete.
 */
export async function onRepairComplete(jobId: string): Promise<void> {
  const supabase = createClient();

  // Jobs table isn't explicitly defined in database.ts but follows the pattern
  // For now we query via offers → customers
  const { data: offers, error } = await supabase
    .from('offers')
    .select('*, customers(*), vehicles:vehicles(*)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !offers?.length) {
    console.error('[EMAIL TRIGGER] onRepairComplete: no offer for job', jobId);
    return;
  }

  const offer = offers[0];
  const customer = offer.customers as Record<string, unknown> | null;
  const vehicle = offer.vehicles as Record<string, unknown> | null;

  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onRepairComplete: customer has no email');
    return;
  }

  const locale = validLocale(customer.locale as string);

  const vehicleInfo = vehicle
    ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim()
    : '';

  const data = {
    customerName: String(customer.name ?? ''),
    vehicleInfo,
    jobNumber: jobId.slice(0, 8),
    collectionDate: null,
    collectionTime: null,
    address: 'Satijnbloem 6, 3068 JP Rotterdam',
  };

  const html = renderTemplate('repairOrderReady', data, locale);
  const subject = getSubject('repairOrderReady', data, locale);
  const to = String(customer.email);

  const result = await sendEmail(to, subject, html);

  await logEmail({
    to,
    subject,
    template: 'repairOrderReady',
    locale,
    ref_type: 'job',
    ref_id: jobId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
  });
}
