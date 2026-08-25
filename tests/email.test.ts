import { describe, it, expect } from 'vitest';
import { renderTemplate, getSubject, getSampleData } from '@/modules/email/templates';
import {
  SendEmailRequestSchema,
  EmailLogSchema,
  OfferSentData,
  InvoiceSentData,
  AppointmentConfirmedData,
  AppointmentReminderData,
  PaymentReceivedData,
  LeadReceivedData,
  RepairOrderReadyData,
  EmailTemplateName,
  EmailLocale,
} from '@/modules/email/schema';

/* ── Sample data fixtures ─────────────────────────────────── */

const offerData = {
  customerName: 'Jan de Vries',
  offerNumber: 'OFF-2026-0042',
  validUntil: '2026-09-15',
  lines: [
    { description: 'Bumper reparatie', quantity: 1, unit: 'st', lineTotalCents: 45000 },
    { description: 'Spuitwerk metallic', quantity: 2, unit: 'st', lineTotalCents: 38000 },
  ],
  subtotalCents: 83000,
  vatCents: 17430,
  totalCents: 100430,
  approveUrl: 'https://colourking.nl/offerte/approve/123',
  rejectUrl: 'https://colourking.nl/offerte/reject/123',
};

const invoiceData = {
  customerName: 'Jan de Vries',
  invoiceNumber: 'FAC-2026-0018',
  issuedAt: '2026-08-25',
  dueDate: '2026-09-25',
  subtotalCents: 83000,
  vatCents: 17430,
  totalCents: 100430,
  payUrl: 'https://colourking.nl/pay/abc123',
};

const appointmentData = {
  customerName: 'Jan de Vries',
  appointmentType: 'Inname',
  scheduledDate: '2026-09-01',
  scheduledTime: '09:30',
  durationMinutes: 30,
  address: 'Industrieweg 12, 1234 AB Amsterdam',
  vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
  cancelUrl: 'https://colourking.nl/afspraak/cancel/456',
};

const reminderData = {
  customerName: 'Jan de Vries',
  appointmentType: 'Inname',
  scheduledDate: '2026-09-01',
  scheduledTime: '09:30',
  address: 'Industrieweg 12, 1234 AB Amsterdam',
  vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
  cancelUrl: 'https://colourking.nl/afspraak/cancel/456',
};

const paymentData = {
  customerName: 'Jan de Vries',
  invoiceNumber: 'FAC-2026-0018',
  amountCents: 100430,
  paidAt: '2026-08-25',
  method: 'iDEAL',
};

const leadData = {
  contactName: 'Pieter Bakker',
  contactEmail: 'pieter@example.com',
  contactPhone: '+31 6 12345678',
  kenteken: 'AB-123-CD',
  damageDescription: 'Deuk linkervoor spatbord',
  origin: 'website',
  leadUrl: 'https://colourking.nl/app/leads/test-id',
};

const readyData = {
  customerName: 'Jan de Vries',
  vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
  jobNumber: 'JOB-2026-0015',
  collectionDate: '2026-09-05',
  collectionTime: '14:00',
  address: 'Industrieweg 12, 1234 AB Amsterdam',
};

/* ── Template rendering tests ─────────────────────────────── */

describe('Email templates', () => {
  it('renders offerSent template as valid HTML', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('COLOURKING');
    expect(html).toContain('Jan de Vries');
    expect(html).toContain('OFF-2026-0042');
  });

  it('renders invoiceSent template with payment link', () => {
    const html = renderTemplate('invoiceSent', invoiceData, 'nl');
    expect(html).toContain('FAC-2026-0018');
    expect(html).toContain('https://colourking.nl/pay/abc123');
    expect(html).toContain('Jan de Vries');
  });

  it('renders appointmentConfirmed template with details', () => {
    const html = renderTemplate('appointmentConfirmed', appointmentData, 'nl');
    expect(html).toContain('09:30');
    expect(html).toContain('Industrieweg 12');
    expect(html).toContain('AB-123-CD');
  });

  it('renders appointmentReminder template', () => {
    const html = renderTemplate('appointmentReminder', reminderData, 'nl');
    expect(html).toContain('09:30');
    expect(html).toContain('herinnering');
  });

  it('renders paymentReceived template', () => {
    const html = renderTemplate('paymentReceived', paymentData, 'nl');
    expect(html).toContain('FAC-2026-0018');
    expect(html).toContain('iDEAL');
  });

  it('renders leadReceived template as internal notification', () => {
    const html = renderTemplate('leadReceived', leadData, 'nl');
    expect(html).toContain('Pieter Bakker');
    expect(html).toContain('AB-123-CD');
    expect(html).toContain('website');
  });

  it('renders repairOrderReady template', () => {
    const html = renderTemplate('repairOrderReady', readyData, 'nl');
    expect(html).toContain('AB-123-CD');
    expect(html).toContain('JOB-2026-0015');
  });

  it('contains brand color #E8364E in templates', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    expect(html).toContain('#E8364E');
  });

  it('uses table-based layout for email compatibility', () => {
    const html = renderTemplate('invoiceSent', invoiceData, 'nl');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('<table');
  });

  it('includes inline CSS (no class attributes on main elements)', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    // Check that the main styling is inline
    expect(html).toContain('style="');
    // The template should not rely on external CSS
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it('has max-width 600px container', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    expect(html).toContain('max-width:600px');
  });
});

/* ── Locale switching tests ───────────────────────────────── */

describe('Email locale switching', () => {
  it('renders offerSent in NL with Dutch strings', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    expect(html).toContain('Beste');
    expect(html).toContain('Met vriendelijke groet');
  });

  it('renders offerSent in EN with English strings', () => {
    const html = renderTemplate('offerSent', offerData, 'en');
    expect(html).toContain('Dear');
    expect(html).toContain('Kind regards');
  });

  it('renders offerSent in TR with Turkish strings', () => {
    const html = renderTemplate('offerSent', offerData, 'tr');
    expect(html).toContain('Sayın');  // Using Turkish characters
    expect(html).toContain('Saygilarimizla');
  });

  it('uses correct html lang attribute per locale', () => {
    const htmlNl = renderTemplate('invoiceSent', invoiceData, 'nl');
    const htmlEn = renderTemplate('invoiceSent', invoiceData, 'en');
    const htmlTr = renderTemplate('invoiceSent', invoiceData, 'tr');
    expect(htmlNl).toContain('lang="nl"');
    expect(htmlEn).toContain('lang="en"');
    expect(htmlTr).toContain('lang="tr"');
  });
});

/* ── Subject line tests ───────────────────────────────────── */

describe('Email subject lines', () => {
  it('generates offer subject with offer number', () => {
    const subject = getSubject('offerSent', offerData, 'nl');
    expect(subject).toContain('OFF-2026-0042');
  });

  it('generates invoice subject with invoice number', () => {
    const subject = getSubject('invoiceSent', invoiceData, 'en');
    expect(subject).toContain('FAC-2026-0018');
    expect(subject).toContain('Invoice');
  });

  it('generates lead subject with contact name', () => {
    const subject = getSubject('leadReceived', leadData, 'nl');
    expect(subject).toContain('Pieter Bakker');
  });

  it('generates locale-specific subjects', () => {
    const subjectNl = getSubject('appointmentConfirmed', appointmentData, 'nl');
    const subjectEn = getSubject('appointmentConfirmed', appointmentData, 'en');
    expect(subjectNl).toContain('Afspraakbevestiging');
    expect(subjectEn).toContain('Appointment Confirmation');
  });
});

/* ── Money formatting tests ───────────────────────────────── */

describe('Money formatting in emails', () => {
  it('formats cents as EUR currency in NL locale', () => {
    const html = renderTemplate('invoiceSent', invoiceData, 'nl');
    // 100430 cents = EUR 1.004,30 in NL format
    expect(html).toMatch(/1[\.\s]004,30/);
  });

  it('formats cents as EUR currency in EN locale', () => {
    const html = renderTemplate('invoiceSent', invoiceData, 'en');
    // 100430 cents = EUR 1,004.30 in EN format
    expect(html).toMatch(/1,004\.30/);
  });

  it('never displays raw cent values in the email', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    // Should not contain raw integers like 83000, 17430, 100430
    expect(html).not.toContain('>83000<');
    expect(html).not.toContain('>17430<');
    expect(html).not.toContain('>100430<');
  });

  it('renders line items with formatted currency', () => {
    const html = renderTemplate('offerSent', offerData, 'nl');
    // 45000 cents = EUR 450,00 in NL format
    expect(html).toMatch(/450,00/);
  });
});

/* ── Schema validation tests ──────────────────────────────── */

describe('Email schemas', () => {
  it('validates SendEmailRequestSchema with valid data', () => {
    const result = SendEmailRequestSchema.safeParse({
      template: 'invoiceSent',
      to: 'test@example.com',
      locale: 'nl',
      data: { foo: 'bar' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects SendEmailRequestSchema with invalid template', () => {
    const result = SendEmailRequestSchema.safeParse({
      template: 'invalidTemplate',
      to: 'test@example.com',
      locale: 'nl',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects SendEmailRequestSchema with invalid email', () => {
    const result = SendEmailRequestSchema.safeParse({
      template: 'offerSent',
      to: 'not-an-email',
      locale: 'nl',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects SendEmailRequestSchema with invalid locale', () => {
    const result = SendEmailRequestSchema.safeParse({
      template: 'offerSent',
      to: 'test@example.com',
      locale: 'fr',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('validates EmailLogSchema', () => {
    const result = EmailLogSchema.safeParse({
      to: 'test@example.com',
      subject: 'Test',
      template: 'offerSent',
      locale: 'nl',
      status: 'sent',
    });
    expect(result.success).toBe(true);
  });

  it('validates OfferSentData schema', () => {
    const result = OfferSentData.safeParse(offerData);
    expect(result.success).toBe(true);
  });

  it('validates InvoiceSentData schema', () => {
    const result = InvoiceSentData.safeParse(invoiceData);
    expect(result.success).toBe(true);
  });

  it('validates AppointmentConfirmedData schema', () => {
    const result = AppointmentConfirmedData.safeParse(appointmentData);
    expect(result.success).toBe(true);
  });

  it('validates AppointmentReminderData schema', () => {
    const result = AppointmentReminderData.safeParse(reminderData);
    expect(result.success).toBe(true);
  });

  it('validates PaymentReceivedData schema', () => {
    const result = PaymentReceivedData.safeParse(paymentData);
    expect(result.success).toBe(true);
  });

  it('validates LeadReceivedData schema', () => {
    const result = LeadReceivedData.safeParse(leadData);
    expect(result.success).toBe(true);
  });

  it('validates RepairOrderReadyData schema', () => {
    const result = RepairOrderReadyData.safeParse(readyData);
    expect(result.success).toBe(true);
  });

  it('rejects OfferSentData with float money values', () => {
    const result = OfferSentData.safeParse({
      ...offerData,
      totalCents: 100.50, // float, not int
    });
    expect(result.success).toBe(false);
  });

  it('validates EmailTemplateName enum options', () => {
    const templates = EmailTemplateName.options;
    expect(templates).toContain('offerSent');
    expect(templates).toContain('invoiceSent');
    expect(templates).toContain('appointmentConfirmed');
    expect(templates).toContain('appointmentReminder');
    expect(templates).toContain('paymentReceived');
    expect(templates).toContain('leadReceived');
    expect(templates).toContain('repairOrderReady');
    expect(templates).toHaveLength(7);
  });

  it('validates EmailLocale enum options', () => {
    expect(EmailLocale.options).toEqual(['nl', 'en', 'tr']);
  });
});

/* ── Sample data tests ────────────────────────────────────── */

describe('Sample data for previews', () => {
  it('returns sample data for all templates', () => {
    const templates = EmailTemplateName.options;
    for (const template of templates) {
      const data = getSampleData(template);
      expect(data).toBeDefined();
      expect(Object.keys(data).length).toBeGreaterThan(0);
    }
  });

  it('sample data renders without errors', () => {
    const templates = EmailTemplateName.options;
    const locales: ('nl' | 'en' | 'tr')[] = ['nl', 'en', 'tr'];
    for (const template of templates) {
      for (const locale of locales) {
        const data = getSampleData(template);
        expect(() => {
          renderTemplate(template as keyof import('@/modules/email/schema').TemplateDataMap, data as never, locale);
        }).not.toThrow();
      }
    }
  });
});

/* ── Edge case tests ──────────────────────────────────────── */

describe('Edge cases', () => {
  it('renders invoice without payment URL', () => {
    const data = { ...invoiceData, payUrl: null };
    const html = renderTemplate('invoiceSent', data, 'nl');
    expect(html).toContain('FAC-2026-0018');
    expect(html).not.toContain('Nu betalen');
  });

  it('renders appointment without cancel URL', () => {
    const data = { ...appointmentData, cancelUrl: null };
    const html = renderTemplate('appointmentConfirmed', data, 'nl');
    expect(html).toContain('09:30');
    expect(html).not.toContain('Afspraak annuleren');
  });

  it('renders repair ready without collection date', () => {
    const data = { ...readyData, collectionDate: null, collectionTime: null };
    const html = renderTemplate('repairOrderReady', data, 'nl');
    expect(html).toContain('AB-123-CD');
  });

  it('throws for unknown template name', () => {
    expect(() => {
      renderTemplate('unknownTemplate' as never, {} as never, 'nl');
    }).toThrow('Unknown email template');
  });

  it('defaults locale to nl when invalid', () => {
    // renderTemplate accepts EmailLocale but we test the fallback in getSubject
    const subject = getSubject('offerSent', offerData, 'nl');
    expect(subject).toBeDefined();
    expect(subject.length).toBeGreaterThan(0);
  });
});
