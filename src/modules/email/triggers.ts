/**
 * Email trigger functions for business events.
 * Each function fetches required data from the database,
 * renders the appropriate template, and sends the email.
 *
 * Called from API routes and server actions when the corresponding event
 * occurs. Uses the admin (service role) client so it works in all contexts.
 */

import { admin as supabase } from '@/lib/supabase/admin';
import { renderTemplate, getSubject, renderAppointmentRequest } from './templates';
import { sendEmail } from './sender';
import { logEmail } from './log';
import type { EmailLocale } from './schema';
import { getCompanyInfo } from '@/lib/company';
import { getSender } from '@/lib/email-identity';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://colourking.nl';

export type SendOutcome = { success: boolean; to?: string; locale?: EmailLocale; messageId?: string; error?: string };

function validLocale(locale: string | null | undefined): EmailLocale {
  if (locale === 'en' || locale === 'tr') return locale;
  return 'nl';
}

/**
 * Send offer email to customer when an offer is sent.
 */
export async function onOfferSent(offerId: string): Promise<SendOutcome> {

  const { data: offer, error } = await supabase
    .from('offers')
    .select('*, customers(*), offer_lines(*)')
    .eq('id', offerId)
    .single();

  if (error || !offer) {
    console.error('[EMAIL TRIGGER] onOfferSent: offer not found', offerId);
    return { success: false, error: 'not_found' };
  }

  const customer = offer.customers as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onOfferSent: customer has no email');
    return { success: false, error: 'no_email' };
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
    approveUrl: `${APP_URL}/contact?ref=${encodeURIComponent(offer.offer_number ?? offerId.slice(0, 8))}&action=approve`,
    rejectUrl: `${APP_URL}/contact?ref=${encodeURIComponent(offer.offer_number ?? offerId.slice(0, 8))}&action=reject`,
  };

  const company = await getCompanyInfo();
  const html = renderTemplate('offerSent', data, locale, company);
  const subject = getSubject('offerSent', data, locale);
  const to = String(customer.email);

  const sender = await getSender('offers');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to,
    subject,
    template: 'offerSent',
    locale,
    ref_type: 'offer',
    ref_id: offerId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Send invoice email with payment link when an invoice is issued.
 */
export async function onInvoiceIssued(invoiceId: string): Promise<SendOutcome> {

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
    return { success: false, error: 'not_found' };
  }

  const customer = doc.customers as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onInvoiceIssued: customer has no email');
    return { success: false, error: 'no_email' };
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
      ? `${APP_URL}/s/${String(payload.payment_token)}`
      : null,
  };

  const company = await getCompanyInfo();
  const html = renderTemplate('invoiceSent', data, locale, company);
  const subject = getSubject('invoiceSent', data, locale);
  const to = String(customer.email);

  const sender = await getSender('invoices');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to,
    subject,
    template: 'invoiceSent',
    locale,
    ref_type: 'invoice',
    ref_id: invoiceId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Send appointment confirmation email.
 */
export async function onAppointmentConfirmed(appointmentId: string): Promise<SendOutcome> {

  const { data: apt, error } = await supabase
    .from('appointments')
    .select('*, customers(*), vehicles(*)')
    .eq('id', appointmentId)
    .single();

  if (error || !apt) {
    console.error('[EMAIL TRIGGER] onAppointmentConfirmed: not found', appointmentId);
    return { success: false, error: 'not_found' };
  }

  const email = apt.contact_email;
  const customer = apt.customers as Record<string, unknown> | null;
  const vehicle = apt.vehicles as Record<string, unknown> | null;
  const to = email ?? (customer?.email as string) ?? null;

  if (!to) {
    console.warn('[EMAIL TRIGGER] onAppointmentConfirmed: no email address');
    return { success: false, error: 'no_email' };
  }

  const locale = validLocale(customer?.locale as string);

  const vehicleInfo = vehicle
    ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim()
    : null;

  const company = await getCompanyInfo();

  const data = {
    customerName: apt.contact_name ?? String(customer?.name ?? ''),
    appointmentType: apt.type,
    scheduledDate: apt.scheduled_date,
    scheduledTime: apt.scheduled_time,
    durationMinutes: apt.duration_minutes,
    address: `${company.address}, ${company.postcode} ${company.city}`,
    vehicleInfo,
    cancelUrl: `${APP_URL}/contact?ref=AP-${appointmentId.slice(0, 8)}&action=cancel`,
  };
  const html = renderTemplate('appointmentConfirmed', data, locale, company);
  const subject = getSubject('appointmentConfirmed', data, locale);

  const sender = await getSender('appointments');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to,
    subject,
    template: 'appointmentConfirmed',
    locale,
    ref_type: 'appointment',
    ref_id: appointmentId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Send payment confirmation email.
 */
export async function onPaymentReceived(paymentId: string): Promise<void> {

  // Look up the payment, then its invoice + customer
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .select('id, invoice_id, amount_cents, method, paid_at')
    .eq('id', paymentId)
    .single();

  if (payErr || !payment) {
    console.error('[EMAIL TRIGGER] onPaymentReceived: payment not found', paymentId);
    return;
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_id, locale, customers(id, name, email, locale)')
    .eq('id', payment.invoice_id)
    .single();

  if (invErr || !invoice) {
    console.error('[EMAIL TRIGGER] onPaymentReceived: invoice not found', payment.invoice_id);
    return;
  }

  const rawCustomer = invoice.customers;
  const customer = (Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer) as Record<string, unknown> | null;
  if (!customer?.email) {
    console.warn('[EMAIL TRIGGER] onPaymentReceived: customer has no email');
    return;
  }

  const locale = validLocale((customer.locale as string) ?? invoice.locale);

  const methodMap: Record<string, string> = {
    ideal: 'iDEAL',
    bank_transfer: 'Bankoverschrijving',
    cash: 'Contant',
    card: 'Pinpas',
    mollie: 'Mollie',
  };

  const data = {
    customerName: String(customer.name ?? ''),
    invoiceNumber: invoice.invoice_number ?? '',
    amountCents: payment.amount_cents,
    paidAt: payment.paid_at ?? new Date().toISOString(),
    method: methodMap[payment.method] ?? payment.method,
  };

  const company = await getCompanyInfo();
  const html = renderTemplate('paymentReceived', data, locale, company);
  const subject = getSubject('paymentReceived', data, locale);
  const to = String(customer.email);

  const sender = await getSender('invoices');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to,
    subject,
    template: 'paymentReceived',
    locale,
    ref_type: 'payment',
    ref_id: paymentId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });
}

/**
 * Send internal notification to staff about a new lead.
 */
export async function onLeadCreated(leadId: string): Promise<void> {

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    console.error('[EMAIL TRIGGER] onLeadCreated: not found', leadId);
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
    leadNumber: lead.number ?? null,
    appointmentType: lead.channel === 'appointment_form' ? (lead.appointment_type ?? 'inspection') : null,
    scheduledDate: lead.scheduled_date ?? null,
    scheduledTime: lead.scheduled_time ?? null,
    location: lead.location ?? null,
    locationAddress: lead.location_address ?? null,
  };

  // Collect staff recipients; fall back to SHOP_EMAIL / hardcoded shop email
  const { data: staff } = await supabase
    .from('staff')
    .select('email, locale')
    .in('role', ['admin', 'office'])
    .eq('active', true);

  const SHOP_EMAIL = process.env.SHOP_EMAIL ?? 'colourking85@gmail.com';

  const recipients: Array<{ email: string; locale: string }> =
    staff?.length
      ? staff
      : [{ email: SHOP_EMAIL, locale: 'nl' }];

  const company = await getCompanyInfo();
  const sender = await getSender('leads');

  for (const member of recipients) {
    const locale = validLocale(member.locale);
    const html = renderTemplate('leadReceived', data, locale, company);
    const subject = getSubject('leadReceived', data, locale);

    const result = await sendEmail(member.email, subject, html, sender);

    await logEmail({
      to: member.email,
      subject,
      template: 'leadReceived',
      locale,
      ref_type: 'lead',
      ref_id: leadId,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      from: sender.from,
      messageId: result.messageId,
    });
  }

  // Send confirmation email to the customer for appointment leads
  if (lead.contact_email && lead.channel === 'appointment_form') {
    const customerLocale = validLocale(lead.locale);

    const { html: custHtml, subject: custSubject } = renderAppointmentRequest(
      {
        contactName: lead.contact_name,
        kenteken: lead.kenteken,
        appointmentType: lead.appointment_type ?? 'inspection',
        scheduledDate: lead.scheduled_date,
        scheduledTime: lead.scheduled_time,
        location: lead.location,
        locationAddress: lead.location_address,
      },
      customerLocale,
      company,
    );

    const custSender = await getSender('appointments');
    const custResult = await sendEmail(lead.contact_email, custSubject, custHtml, custSender);

    await logEmail({
      to: lead.contact_email,
      subject: custSubject,
      template: 'leadReceived',
      locale: customerLocale,
      ref_type: 'lead',
      ref_id: leadId,
      status: custResult.success ? 'sent' : 'failed',
      error: custResult.error,
      from: custSender.from,
      messageId: custResult.messageId,
    });
  }
}

/**
 * "Your car is ready" email. Sent on request from JB10 (staff confirms) or by
 * the reminder engine. Returns the send result so the caller can log it.
 */
export async function sendVehicleReady(jobId: string): Promise<{
  success: boolean;
  to?: string;
  locale?: EmailLocale;
  messageId?: string;
  error?: string;
}> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, number, customers(name, email, locale), vehicles(kenteken, make, model)')
    .eq('id', jobId)
    .single();

  if (error || !job) return { success: false, error: 'job_not_found' };

  const customer = (Array.isArray(job.customers) ? job.customers[0] : job.customers) as Record<string, unknown> | null;
  const vehicle = (Array.isArray(job.vehicles) ? job.vehicles[0] : job.vehicles) as Record<string, unknown> | null;

  if (!customer?.email) return { success: false, error: 'no_email' };

  const locale = validLocale(customer.locale as string);
  const to = String(customer.email);
  const vehicleInfo = vehicle
    ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim()
    : '';

  const company = await getCompanyInfo();
  const data = {
    customerName: String(customer.name ?? ''),
    vehicleInfo,
    jobNumber: job.number != null ? `JB-${job.number}` : null,
    collectionDate: null,
    collectionTime: null,
    address: `${company.address}, ${company.postcode} ${company.city}`,
    openingHours: 'Ma – Vr: 08:00 – 17:30 | Za: 09:00 – 13:00',
  };

  const html = renderTemplate('vehicleReady', data, locale, company);
  const subject = `${getSubject('vehicleReady', data, locale)} [JB-${job.number}]`;
  const sender = await getSender('workshop');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to,
    subject,
    template: 'vehicleReady',
    locale,
    ref_type: 'job',
    ref_id: jobId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Payment reminder for a sent/overdue invoice, sent on request from FA10.
 */
export async function sendInvoiceReminder(invoiceId: string): Promise<SendOutcome> {
  const { data: inv } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, due_date, total_cents, payment_token, locale, customers(name, email, locale)')
    .eq('id', invoiceId)
    .single();
  if (!inv) return { success: false, error: 'not_found' };

  const customer = (Array.isArray(inv.customers) ? inv.customers[0] : inv.customers) as Record<string, unknown> | null;
  if (!customer?.email) return { success: false, error: 'no_email' };

  const locale = validLocale((customer.locale as string) ?? inv.locale);
  const company = await getCompanyInfo();
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = inv.due_date ?? today;
  const daysOverdue = Math.max(0, Math.round((Date.parse(today) - Date.parse(dueDate)) / 86_400_000));
  const overdue = daysOverdue > 0;
  const template = overdue ? 'invoiceOverdue' : 'invoiceDueSoon';
  const data = {
    customerName: String(customer.name ?? ''),
    invoiceNumber: inv.invoice_number ?? invoiceId.slice(0, 8),
    dueDate,
    totalCents: inv.total_cents,
    payUrl: inv.payment_token ? `${APP_URL}/s/${inv.payment_token}` : null,
    iban: company.iban,
    daysOverdue,
  };
  const html = renderTemplate(template, data, locale, company);
  const subject = `${getSubject(template, data, locale)} [${data.invoiceNumber}]`;
  const to = String(customer.email);
  const sender = await getSender('invoices');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to, subject, template, locale, ref_type: 'invoice', ref_id: invoiceId,
    status: result.success ? 'sent' : 'failed', error: result.error, from: sender.from, messageId: result.messageId,
  });
  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Appointment reminder, sent on request from AP10 (the cron uses the same template).
 */
export async function sendAppointmentReminder(appointmentId: string): Promise<SendOutcome> {
  const { data: apt } = await supabase
    .from('appointments')
    .select('*, customers(name, email, locale), vehicles(kenteken, make, model)')
    .eq('id', appointmentId)
    .single();
  if (!apt) return { success: false, error: 'not_found' };

  const customer = apt.customers as Record<string, unknown> | null;
  const vehicle = apt.vehicles as Record<string, unknown> | null;
  const to = apt.contact_email ?? (customer?.email as string | undefined) ?? null;
  if (!to) return { success: false, error: 'no_email' };

  const locale = validLocale(customer?.locale as string);
  const company = await getCompanyInfo();
  const data = {
    customerName: apt.contact_name ?? String(customer?.name ?? ''),
    appointmentType: apt.type,
    scheduledDate: apt.scheduled_date,
    scheduledTime: String(apt.scheduled_time).slice(0, 5),
    address: `${company.address}, ${company.postcode} ${company.city}`,
    vehicleInfo: vehicle ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim() : null,
    cancelUrl: `${APP_URL}/contact?ref=AP-${appointmentId.slice(0, 8)}&action=cancel`,
  };
  const html = renderTemplate('appointmentReminder', data, locale, company);
  const subject = getSubject('appointmentReminder', data, locale);
  const sender = await getSender('appointments');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to, subject, template: 'appointmentReminder', locale, ref_type: 'appointment', ref_id: appointmentId,
    status: result.success ? 'sent' : 'failed', error: result.error, from: sender.from, messageId: result.messageId,
  });
  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}

/**
 * Emails the customer the public handover-note link (to view and sign).
 * Creates a share token when the document has none or it has expired.
 */
export async function onHandoverShared(documentId: string): Promise<SendOutcome> {
  const { data: doc } = await supabase
    .from('documents')
    .select('id, doc_number, doc_type, status, locale, share_token, share_expires_at, customers(name, email, locale), vehicles(kenteken, make, model)')
    .eq('id', documentId)
    .single();
  if (!doc || doc.doc_type !== 'handover_note') return { success: false, error: 'not_found' };
  if (doc.status === 'draft') return { success: false, error: 'draft' };

  const customer = (Array.isArray(doc.customers) ? doc.customers[0] : doc.customers) as Record<string, unknown> | null;
  const vehicle = (Array.isArray(doc.vehicles) ? doc.vehicles[0] : doc.vehicles) as Record<string, unknown> | null;
  if (!customer?.email) return { success: false, error: 'no_email' };

  let token = doc.share_token;
  const expired = !doc.share_expires_at || Date.parse(doc.share_expires_at) < Date.now() + 86_400_000;
  if (!token || expired) {
    token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const { error } = await supabase
      .from('documents')
      .update({ share_token: token, share_expires_at: expiresAt.toISOString() })
      .eq('id', documentId);
    if (error) return { success: false, error: error.message };
  }

  const locale = validLocale((customer.locale as string) ?? doc.locale);
  const company = await getCompanyInfo();
  const data = {
    customerName: String(customer.name ?? ''),
    docNumber: doc.doc_number ?? documentId.slice(0, 8),
    vehicleInfo: vehicle ? `${vehicle.kenteken ?? ''} (${vehicle.make ?? ''} ${vehicle.model ?? ''})`.trim() : null,
    signUrl: `${APP_URL}/s/handover/${token}`,
  };
  const html = renderTemplate('handoverShare', data, locale, company);
  const subject = `${getSubject('handoverShare', data, locale)} [${data.docNumber}]`;
  const to = String(customer.email);
  const sender = await getSender('workshop');
  const result = await sendEmail(to, subject, html, sender);

  await logEmail({
    to, subject, template: 'handoverShare', locale, ref_type: 'document', ref_id: documentId,
    status: result.success ? 'sent' : 'failed', error: result.error, from: sender.from, messageId: result.messageId,
  });
  return { success: result.success, to, locale, messageId: result.messageId, error: result.error };
}
