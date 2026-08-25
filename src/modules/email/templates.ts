/**
 * HTML email templates for Colourking.
 * All templates use inline CSS for email-client compatibility.
 * Table-based layout for Outlook. Max-width 600px. Mobile responsive.
 * Brand color: #E8364E for headers/CTAs.
 */

import type { TemplateDataMap, EmailLocale } from './schema';

/* ── Formatting helpers ───────────────────────────────────── */

function formatCurrency(cents: number, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Date(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ── Locale strings for email templates ───────────────────── */

type EmailStrings = Record<string, string>;

const STRINGS: Record<string, EmailStrings> = {
  nl: {
    dear: 'Beste',
    regards: 'Met vriendelijke groet',
    team: 'Het Colourking team',
    viewOnline: 'Online bekijken',
    unsubscribe: 'Afmelden',
    companyFooter: 'Colourking B.V. | Industrieweg 12, 1234 AB Amsterdam | KvK: 12345678 | BTW: NL123456789B01',

    // Offer
    offerSubject: 'Uw offerte {offerNumber} van Colourking',
    offerIntro: 'Hierbij ontvangt u onze offerte voor de werkzaamheden aan uw voertuig.',
    offerDescription: 'Omschrijving',
    offerQty: 'Aantal',
    offerTotal: 'Bedrag',
    offerSubtotal: 'Subtotaal',
    offerVat: 'BTW',
    offerGrandTotal: 'Totaal',
    offerValidUntil: 'Geldig tot',
    offerApprove: 'Offerte goedkeuren',
    offerReject: 'Offerte afwijzen',

    // Invoice
    invoiceSubject: 'Factuur {invoiceNumber} van Colourking',
    invoiceIntro: 'Hierbij ontvangt u de factuur voor de uitgevoerde werkzaamheden.',
    invoiceDueDate: 'Vervaldatum',
    invoicePayNow: 'Nu betalen',

    // Appointment
    appointmentSubject: 'Afspraakbevestiging - Colourking',
    appointmentIntro: 'Uw afspraak is bevestigd. Hieronder vindt u de details.',
    appointmentDate: 'Datum',
    appointmentTime: 'Tijd',
    appointmentDuration: 'Duur',
    appointmentAddress: 'Adres',
    appointmentVehicle: 'Voertuig',
    appointmentType: 'Type',
    appointmentCancel: 'Afspraak annuleren',
    appointmentMinutes: 'minuten',

    // Appointment reminder
    reminderSubject: 'Herinnering: afspraak morgen bij Colourking',
    reminderIntro: 'Dit is een herinnering dat u morgen een afspraak heeft bij Colourking.',

    // Payment
    paymentSubject: 'Betaling ontvangen - Factuur {invoiceNumber}',
    paymentIntro: 'Wij hebben uw betaling in goede orde ontvangen. Hartelijk dank!',
    paymentAmount: 'Bedrag',
    paymentDate: 'Datum',
    paymentMethod: 'Betaalmethode',
    paymentReference: 'Referentie',

    // Lead (internal)
    leadSubject: 'Nieuwe lead: {contactName}',
    leadIntro: 'Er is een nieuwe lead binnengekomen via de website.',
    leadName: 'Naam',
    leadEmail: 'E-mail',
    leadPhone: 'Telefoon',
    leadPlate: 'Kenteken',
    leadDamage: 'Schade',
    leadOrigin: 'Bron',
    leadView: 'Lead bekijken',

    // Repair ready
    readySubject: 'Uw voertuig is klaar - Colourking',
    readyIntro: 'Goed nieuws! Uw voertuig is gereed en kan worden opgehaald.',
    readyVehicle: 'Voertuig',
    readyJob: 'Opdrachtnummer',
    readyCollection: 'Ophaalmoment',
    readyAddress: 'Adres',
  },

  en: {
    dear: 'Dear',
    regards: 'Kind regards',
    team: 'The Colourking team',
    viewOnline: 'View online',
    unsubscribe: 'Unsubscribe',
    companyFooter: 'Colourking B.V. | Industrieweg 12, 1234 AB Amsterdam | CoC: 12345678 | VAT: NL123456789B01',

    offerSubject: 'Your quote {offerNumber} from Colourking',
    offerIntro: 'Please find below our quote for the work on your vehicle.',
    offerDescription: 'Description',
    offerQty: 'Qty',
    offerTotal: 'Amount',
    offerSubtotal: 'Subtotal',
    offerVat: 'VAT',
    offerGrandTotal: 'Total',
    offerValidUntil: 'Valid until',
    offerApprove: 'Approve Quote',
    offerReject: 'Reject Quote',

    invoiceSubject: 'Invoice {invoiceNumber} from Colourking',
    invoiceIntro: 'Please find attached the invoice for the completed work.',
    invoiceDueDate: 'Due date',
    invoicePayNow: 'Pay Now',

    appointmentSubject: 'Appointment Confirmation - Colourking',
    appointmentIntro: 'Your appointment has been confirmed. Please find the details below.',
    appointmentDate: 'Date',
    appointmentTime: 'Time',
    appointmentDuration: 'Duration',
    appointmentAddress: 'Address',
    appointmentVehicle: 'Vehicle',
    appointmentType: 'Type',
    appointmentCancel: 'Cancel Appointment',
    appointmentMinutes: 'minutes',

    reminderSubject: 'Reminder: appointment tomorrow at Colourking',
    reminderIntro: 'This is a friendly reminder that you have an appointment tomorrow at Colourking.',

    paymentSubject: 'Payment received - Invoice {invoiceNumber}',
    paymentIntro: 'We have received your payment. Thank you!',
    paymentAmount: 'Amount',
    paymentDate: 'Date',
    paymentMethod: 'Payment method',
    paymentReference: 'Reference',

    leadSubject: 'New lead: {contactName}',
    leadIntro: 'A new lead has been received from the website.',
    leadName: 'Name',
    leadEmail: 'Email',
    leadPhone: 'Phone',
    leadPlate: 'License plate',
    leadDamage: 'Damage',
    leadOrigin: 'Source',
    leadView: 'View Lead',

    readySubject: 'Your vehicle is ready - Colourking',
    readyIntro: 'Great news! Your vehicle is ready for collection.',
    readyVehicle: 'Vehicle',
    readyJob: 'Job number',
    readyCollection: 'Collection',
    readyAddress: 'Address',
  },

  tr: {
    dear: 'Sayın',
    regards: 'Saygilarimizla',
    team: 'Colourking ekibi',
    viewOnline: 'Online goruntuле',
    unsubscribe: 'Abonelikten cik',
    companyFooter: 'Colourking B.V. | Industrieweg 12, 1234 AB Amsterdam | Ticaret Sicil: 12345678 | KDV: NL123456789B01',

    offerSubject: 'Colourking teklif {offerNumber}',
    offerIntro: 'Araciniz icin hazirlanan teklifimizi asagida bulabilirsiniz.',
    offerDescription: 'Aciklama',
    offerQty: 'Miktar',
    offerTotal: 'Tutar',
    offerSubtotal: 'Ara toplam',
    offerVat: 'KDV',
    offerGrandTotal: 'Toplam',
    offerValidUntil: 'Gecerlilik tarihi',
    offerApprove: 'Teklifi Onayla',
    offerReject: 'Teklifi Reddet',

    invoiceSubject: 'Colourking fatura {invoiceNumber}',
    invoiceIntro: 'Tamamlanan isler icin faturanizi asagida bulabilirsiniz.',
    invoiceDueDate: 'Son odeme tarihi',
    invoicePayNow: 'Simdi Ode',

    appointmentSubject: 'Randevu Onaylandı - Colourking',
    appointmentIntro: 'Randevunuz onaylandi. Detaylari asagida bulabilirsiniz.',
    appointmentDate: 'Tarih',
    appointmentTime: 'Saat',
    appointmentDuration: 'Sure',
    appointmentAddress: 'Adres',
    appointmentVehicle: 'Arac',
    appointmentType: 'Tur',
    appointmentCancel: 'Randevuyu Iptal Et',
    appointmentMinutes: 'dakika',

    reminderSubject: 'Hatirlatma: yarin Colourking randevunuz var',
    reminderIntro: 'Bu, yarin Colourking\'de bir randevunuz oldugunu hatirlatmak icindir.',

    paymentSubject: 'Odeme alindi - Fatura {invoiceNumber}',
    paymentIntro: 'Odemenizi aldik. Tesekkur ederiz!',
    paymentAmount: 'Tutar',
    paymentDate: 'Tarih',
    paymentMethod: 'Odeme yontemi',
    paymentReference: 'Referans',

    leadSubject: 'Yeni musteri adayi: {contactName}',
    leadIntro: 'Web sitesinden yeni bir musteri adayi geldi.',
    leadName: 'Ad',
    leadEmail: 'E-posta',
    leadPhone: 'Telefon',
    leadPlate: 'Plaka',
    leadDamage: 'Hasar',
    leadOrigin: 'Kaynak',
    leadView: 'Musteri Adayini Gor',

    readySubject: 'Araciniz hazir - Colourking',
    readyIntro: 'Iyi haberler! Araciniz tamamlandi ve teslim alinabilir.',
    readyVehicle: 'Arac',
    readyJob: 'Is numarasi',
    readyCollection: 'Teslim zamani',
    readyAddress: 'Adres',
  },
};

function t(locale: string, key: string, vars?: Record<string, string>): string {
  const s = STRINGS[locale]?.[key] ?? STRINGS.nl[key] ?? key;
  if (!vars) return s;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, v),
    s,
  );
}

/* ── Layout helpers ───────────────────────────────────────── */

function wrapLayout(locale: string, body: string): string {
  const s = STRINGS[locale] ?? STRINGS.nl;
  return `<!DOCTYPE html>
<html lang="${locale}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Colourking</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#E8364E;padding:28px 32px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:0.04em;font-family:Arial,Helvetica,sans-serif;">
                    COLOURKING
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:rgba(255,255,255,0.75);padding-top:4px;letter-spacing:0.06em;font-family:Arial,Helvetica,sans-serif;">
                    BODYSHOP &amp; CARCARE
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#9ca3af;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                    ${s.regards},<br>${s.team}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-size:10px;color:#d1d5db;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                    ${s.companyFooter}<br>
                    IBAN: NL00 INGB 0000 0000 00 | info@colourking.nl | +31 20 123 4567
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px 0;font-size:20px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;font-family:Arial,Helvetica,sans-serif;">${text}</p>`;
}

function greeting(locale: string, name: string): string {
  return paragraph(`${t(locale, 'dear')} ${name},`);
}

function ctaButton(text: string, url: string, secondary = false): string {
  const bg = secondary ? '#6b7280' : '#E8364E';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 4px 8px 0;display:inline-block;">
  <tr>
    <td style="background-color:${bg};border-radius:6px;padding:12px 24px;">
      <a href="${url}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;display:inline-block;">${text}</a>
    </td>
  </tr>
</table>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #f3f4f6;width:140px;">${label}</td>
  <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #f3f4f6;">${value}</td>
</tr>`;
}

function detailTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
  ${rows}
</table>`;
}

function divider(): string {
  return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">';
}

/* ── Template renderers ───────────────────────────────────── */

function renderOfferSent(data: TemplateDataMap['offerSent'], locale: EmailLocale): string {
  let lineRows = '';
  for (const line of data.lines) {
    lineRows += `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #f3f4f6;">${line.description}</td>
      <td style="padding:8px 12px;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #f3f4f6;text-align:center;">${line.quantity} ${line.unit}</td>
      <td style="padding:8px 12px;font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid #f3f4f6;text-align:right;">${formatCurrency(line.lineTotalCents, locale)}</td>
    </tr>`;
  }

  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'offerIntro'))}
    ${paragraph(`<strong>${t(locale, 'paymentReference')}:</strong> ${data.offerNumber}`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-family:Arial,Helvetica,sans-serif;text-align:left;">${t(locale, 'offerDescription')}</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-family:Arial,Helvetica,sans-serif;text-align:center;">${t(locale, 'offerQty')}</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-family:Arial,Helvetica,sans-serif;text-align:right;">${t(locale, 'offerTotal')}</th>
      </tr>
      ${lineRows}
    </table>
    ${detailTable(
      detailRow(t(locale, 'offerSubtotal'), formatCurrency(data.subtotalCents, locale)) +
      detailRow(t(locale, 'offerVat'), formatCurrency(data.vatCents, locale)) +
      `<tr>
        <td style="padding:10px 12px;font-size:14px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;background-color:#f0fdf4;">${t(locale, 'offerGrandTotal')}</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:bold;color:#166534;font-family:Arial,Helvetica,sans-serif;background-color:#f0fdf4;">${formatCurrency(data.totalCents, locale)}</td>
      </tr>` +
      (data.validUntil ? detailRow(t(locale, 'offerValidUntil'), formatDate(data.validUntil, locale)) : '')
    )}
    <div style="text-align:center;margin:24px 0;">
      ${ctaButton(t(locale, 'offerApprove'), data.approveUrl)}
      ${ctaButton(t(locale, 'offerReject'), data.rejectUrl, true)}
    </div>`;

  return body;
}

function renderInvoiceSent(data: TemplateDataMap['invoiceSent'], locale: EmailLocale): string {
  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'invoiceIntro'))}
    ${detailTable(
      detailRow(t(locale, 'paymentReference'), data.invoiceNumber) +
      detailRow(t(locale, 'paymentDate'), formatDate(data.issuedAt, locale)) +
      (data.dueDate ? detailRow(t(locale, 'invoiceDueDate'), formatDate(data.dueDate, locale)) : '') +
      detailRow(t(locale, 'offerSubtotal'), formatCurrency(data.subtotalCents, locale)) +
      detailRow(t(locale, 'offerVat'), formatCurrency(data.vatCents, locale)) +
      `<tr>
        <td style="padding:10px 12px;font-size:14px;font-weight:bold;color:#111827;font-family:Arial,Helvetica,sans-serif;background-color:#f0fdf4;">${t(locale, 'offerGrandTotal')}</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:bold;color:#166534;font-family:Arial,Helvetica,sans-serif;background-color:#f0fdf4;">${formatCurrency(data.totalCents, locale)}</td>
      </tr>`
    )}
    ${data.payUrl ? `<div style="text-align:center;margin:24px 0;">${ctaButton(t(locale, 'invoicePayNow'), data.payUrl)}</div>` : ''}`;

  return body;
}

function renderAppointmentConfirmed(data: TemplateDataMap['appointmentConfirmed'], locale: EmailLocale): string {
  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'appointmentIntro'))}
    ${detailTable(
      detailRow(t(locale, 'appointmentType'), data.appointmentType) +
      detailRow(t(locale, 'appointmentDate'), formatDate(data.scheduledDate, locale)) +
      detailRow(t(locale, 'appointmentTime'), data.scheduledTime) +
      detailRow(t(locale, 'appointmentDuration'), `${data.durationMinutes} ${t(locale, 'appointmentMinutes')}`) +
      detailRow(t(locale, 'appointmentAddress'), data.address) +
      (data.vehicleInfo ? detailRow(t(locale, 'appointmentVehicle'), data.vehicleInfo) : '')
    )}
    ${data.cancelUrl ? `<div style="text-align:center;margin:24px 0;">${ctaButton(t(locale, 'appointmentCancel'), data.cancelUrl, true)}</div>` : ''}`;

  return body;
}

function renderAppointmentReminder(data: TemplateDataMap['appointmentReminder'], locale: EmailLocale): string {
  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'reminderIntro'))}
    ${detailTable(
      detailRow(t(locale, 'appointmentDate'), formatDate(data.scheduledDate, locale)) +
      detailRow(t(locale, 'appointmentTime'), data.scheduledTime) +
      detailRow(t(locale, 'appointmentAddress'), data.address) +
      (data.vehicleInfo ? detailRow(t(locale, 'appointmentVehicle'), data.vehicleInfo) : '')
    )}
    ${data.cancelUrl ? `<div style="text-align:center;margin:24px 0;">${ctaButton(t(locale, 'appointmentCancel'), data.cancelUrl, true)}</div>` : ''}`;

  return body;
}

function renderPaymentReceived(data: TemplateDataMap['paymentReceived'], locale: EmailLocale): string {
  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'paymentIntro'))}
    ${detailTable(
      detailRow(t(locale, 'paymentReference'), data.invoiceNumber) +
      detailRow(t(locale, 'paymentAmount'), formatCurrency(data.amountCents, locale)) +
      detailRow(t(locale, 'paymentDate'), formatDate(data.paidAt, locale)) +
      detailRow(t(locale, 'paymentMethod'), data.method)
    )}`;

  return body;
}

function renderLeadReceived(data: TemplateDataMap['leadReceived'], locale: EmailLocale): string {
  const body = `
    ${heading(t(locale, 'leadSubject', { contactName: data.contactName }))}
    ${paragraph(t(locale, 'leadIntro'))}
    ${detailTable(
      detailRow(t(locale, 'leadName'), data.contactName) +
      (data.contactEmail ? detailRow(t(locale, 'leadEmail'), data.contactEmail) : '') +
      (data.contactPhone ? detailRow(t(locale, 'leadPhone'), data.contactPhone) : '') +
      (data.kenteken ? detailRow(t(locale, 'leadPlate'), data.kenteken) : '') +
      (data.damageDescription ? detailRow(t(locale, 'leadDamage'), data.damageDescription) : '') +
      detailRow(t(locale, 'leadOrigin'), data.origin)
    )}
    <div style="text-align:center;margin:24px 0;">
      ${ctaButton(t(locale, 'leadView'), data.leadUrl)}
    </div>`;

  return body;
}

function renderRepairOrderReady(data: TemplateDataMap['repairOrderReady'], locale: EmailLocale): string {
  const collectionStr = data.collectionDate
    ? `${formatDate(data.collectionDate, locale)}${data.collectionTime ? ` ${data.collectionTime}` : ''}`
    : '—';

  const body = `
    ${greeting(locale, data.customerName)}
    ${paragraph(t(locale, 'readyIntro'))}
    ${detailTable(
      detailRow(t(locale, 'readyVehicle'), data.vehicleInfo) +
      (data.jobNumber ? detailRow(t(locale, 'readyJob'), data.jobNumber) : '') +
      detailRow(t(locale, 'readyCollection'), collectionStr) +
      detailRow(t(locale, 'readyAddress'), data.address)
    )}`;

  return body;
}

/* ── Public API ────────────────────────────────────────────── */

const RENDERERS: Record<string, (data: unknown, locale: EmailLocale) => string> = {
  offerSent: (d, l) => renderOfferSent(d as TemplateDataMap['offerSent'], l),
  invoiceSent: (d, l) => renderInvoiceSent(d as TemplateDataMap['invoiceSent'], l),
  appointmentConfirmed: (d, l) => renderAppointmentConfirmed(d as TemplateDataMap['appointmentConfirmed'], l),
  appointmentReminder: (d, l) => renderAppointmentReminder(d as TemplateDataMap['appointmentReminder'], l),
  paymentReceived: (d, l) => renderPaymentReceived(d as TemplateDataMap['paymentReceived'], l),
  leadReceived: (d, l) => renderLeadReceived(d as TemplateDataMap['leadReceived'], l),
  repairOrderReady: (d, l) => renderRepairOrderReady(d as TemplateDataMap['repairOrderReady'], l),
};

/**
 * Render an email template to full HTML.
 */
export function renderTemplate<T extends keyof TemplateDataMap>(
  template: T,
  data: TemplateDataMap[T],
  locale: EmailLocale = 'nl',
): string {
  const renderer = RENDERERS[template];
  if (!renderer) throw new Error(`Unknown email template: ${template}`);
  const body = renderer(data, locale);
  return wrapLayout(locale, body);
}

/**
 * Get the subject line for a template.
 */
export function getSubject<T extends keyof TemplateDataMap>(
  template: T,
  data: TemplateDataMap[T],
  locale: EmailLocale = 'nl',
): string {
  const subjectKeys: Record<string, string> = {
    offerSent: 'offerSubject',
    invoiceSent: 'invoiceSubject',
    appointmentConfirmed: 'appointmentSubject',
    appointmentReminder: 'reminderSubject',
    paymentReceived: 'paymentSubject',
    leadReceived: 'leadSubject',
    repairOrderReady: 'readySubject',
  };
  const key = subjectKeys[template];
  if (!key) return 'Colourking';

  // Extract vars from data for subject interpolation
  const d = data as Record<string, unknown>;
  const vars: Record<string, string> = {};
  if (d.offerNumber) vars.offerNumber = String(d.offerNumber);
  if (d.invoiceNumber) vars.invoiceNumber = String(d.invoiceNumber);
  if (d.contactName) vars.contactName = String(d.contactName);

  return t(locale, key, vars);
}

/**
 * Get sample data for a template (for preview).
 */
export function getSampleData(template: string): Record<string, unknown> {
  const samples: Record<string, Record<string, unknown>> = {
    offerSent: {
      customerName: 'Jan de Vries',
      offerNumber: 'OFF-2026-0042',
      validUntil: '2026-09-15',
      lines: [
        { description: 'Bumper reparatie', quantity: 1, unit: 'st', lineTotalCents: 45000 },
        { description: 'Spuitwerk metallic', quantity: 2, unit: 'st', lineTotalCents: 38000 },
        { description: 'Materiaalkosten', quantity: 1, unit: 'set', lineTotalCents: 12500 },
      ],
      subtotalCents: 95500,
      vatCents: 20055,
      totalCents: 115555,
      approveUrl: 'https://colourking.nl/offerte/approve/sample',
      rejectUrl: 'https://colourking.nl/offerte/reject/sample',
    },
    invoiceSent: {
      customerName: 'Jan de Vries',
      invoiceNumber: 'FAC-2026-0018',
      issuedAt: '2026-08-25',
      dueDate: '2026-09-25',
      subtotalCents: 95500,
      vatCents: 20055,
      totalCents: 115555,
      payUrl: 'https://colourking.nl/pay/sample',
    },
    appointmentConfirmed: {
      customerName: 'Jan de Vries',
      appointmentType: 'Inname',
      scheduledDate: '2026-09-01',
      scheduledTime: '09:30',
      durationMinutes: 30,
      address: 'Industrieweg 12, 1234 AB Amsterdam',
      vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
      cancelUrl: 'https://colourking.nl/afspraak/cancel/sample',
    },
    appointmentReminder: {
      customerName: 'Jan de Vries',
      appointmentType: 'Inname',
      scheduledDate: '2026-09-01',
      scheduledTime: '09:30',
      address: 'Industrieweg 12, 1234 AB Amsterdam',
      vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
      cancelUrl: 'https://colourking.nl/afspraak/cancel/sample',
    },
    paymentReceived: {
      customerName: 'Jan de Vries',
      invoiceNumber: 'FAC-2026-0018',
      amountCents: 115555,
      paidAt: '2026-08-25',
      method: 'iDEAL',
    },
    leadReceived: {
      contactName: 'Pieter Bakker',
      contactEmail: 'pieter@example.com',
      contactPhone: '+31 6 12345678',
      kenteken: 'AB-123-CD',
      damageDescription: 'Deuk linkervoor spatbord',
      origin: 'website',
      leadUrl: 'https://colourking.nl/app/leads/sample-id',
    },
    repairOrderReady: {
      customerName: 'Jan de Vries',
      vehicleInfo: 'AB-123-CD (BMW 3 Serie)',
      jobNumber: 'JOB-2026-0015',
      collectionDate: '2026-09-05',
      collectionTime: '14:00',
      address: 'Industrieweg 12, 1234 AB Amsterdam',
    },
  };

  return samples[template] ?? {};
}
