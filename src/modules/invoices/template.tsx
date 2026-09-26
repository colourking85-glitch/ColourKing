/**
 * Professional invoice HTML template for ColourKing.
 * Print-ready, locale-aware, A4 proportions.
 * Renders as a React component — can be printed or exported to PDF.
 */

import type { TaxCode, OfferLineKind } from '@/types/database';
import type { CompanyInfo } from '@/lib/company';

type InvoiceLine = {
  id: string;
  sort_order: number;
  kind: OfferLineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  discount_pct: number;
  line_total_cents: number;
  tax_code: TaxCode;
  vat_amount_cents: number;
  part_number: string | null;
};

type InvoiceData = {
  id: string;
  invoice_number: string | null;
  status: string;
  locale: string;
  invoice_type?: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  tax_summary: Record<string, { base_cents: number; vat_cents: number; rate: number }> | null;
  due_date: string | null;
  issued_at: string | null;
  payment_token: string | null;
  notes: string | null;
  terms: string | null;
  credit_note_id: string | null;
  customers: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    postcode: string | null;
    city: string | null;
    country: string | null;
    kvk_number: string | null;
    btw_number: string | null;
    type: string;
  } | null;
  vehicles: {
    kenteken: string | null;
    make: string | null;
    model: string | null;
  } | null;
  invoice_lines: InvoiceLine[];
};

function fmtCurrency(cents: number, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtNumber(n: number, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.NumberFormat(loc, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

type LocaleStrings = Record<string, string>;

const LOCALES: Record<string, LocaleStrings> = {
  nl: {
    title: 'FACTUUR',
    depositTitle: 'VOORSCHOTFACTUUR',
    creditNoteTitle: 'CREDITNOTA',
    invoiceNumber: 'Factuurnummer',
    invoiceDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    billTo: 'Factuuradres',
    description: 'Omschrijving',
    quantity: 'Aantal',
    unitPrice: 'Stukprijs',
    discount: 'Korting',
    vat: 'BTW',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    vatSummary: 'BTW-specificatie',
    taxCode: 'Code',
    taxBase: 'Grondslag',
    taxRate: 'Tarief',
    taxAmount: 'Bedrag',
    grandTotal: 'Totaal te betalen',
    grandTotalCredit: 'Totaal creditering',
    paymentInfo: 'Betalingsgegevens',
    iban: 'IBAN',
    bic: 'BIC',
    reference: 'Referentie',
    accountHolder: 'Ten name van',
    payOnline: 'Betaal online',
    payOnlineDesc: 'U kunt deze factuur ook online betalen via iDEAL, creditcard of overboeking.',
    terms: 'Voorwaarden',
    vehicle: 'Voertuig',
    kvk: 'KvK',
    btw: 'BTW-nr',
    tel: 'Tel',
    page: 'Pagina',
    draft: 'CONCEPT',
  },
  en: {
    title: 'INVOICE',
    depositTitle: 'DEPOSIT INVOICE',
    creditNoteTitle: 'CREDIT NOTE',
    invoiceNumber: 'Invoice number',
    invoiceDate: 'Invoice date',
    dueDate: 'Due date',
    billTo: 'Bill to',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    discount: 'Discount',
    vat: 'VAT',
    total: 'Total',
    subtotal: 'Subtotal',
    vatSummary: 'VAT specification',
    taxCode: 'Code',
    taxBase: 'Base',
    taxRate: 'Rate',
    taxAmount: 'Amount',
    grandTotal: 'Total amount due',
    grandTotalCredit: 'Total credit',
    paymentInfo: 'Payment details',
    iban: 'IBAN',
    bic: 'BIC',
    reference: 'Reference',
    accountHolder: 'Account holder',
    payOnline: 'Pay online',
    payOnlineDesc: 'You can also pay this invoice online via iDEAL, credit card or bank transfer.',
    terms: 'Terms & conditions',
    vehicle: 'Vehicle',
    kvk: 'CoC',
    btw: 'VAT no.',
    tel: 'Tel',
    page: 'Page',
    draft: 'DRAFT',
  },
  tr: {
    title: 'FATURA',
    depositTitle: 'DEPOZİTO FATURASI',
    creditNoteTitle: 'ALACAK DEKONTU',
    invoiceNumber: 'Fatura numarası',
    invoiceDate: 'Fatura tarihi',
    dueDate: 'Son ödeme tarihi',
    billTo: 'Fatura adresi',
    description: 'Açıklama',
    quantity: 'Miktar',
    unitPrice: 'Birim fiyat',
    discount: 'İndirim',
    vat: 'KDV',
    total: 'Toplam',
    subtotal: 'Ara toplam',
    vatSummary: 'KDV detayı',
    taxCode: 'Kod',
    taxBase: 'Matrah',
    taxRate: 'Oran',
    taxAmount: 'Tutar',
    grandTotal: 'Ödenecek toplam',
    grandTotalCredit: 'Toplam alacak',
    paymentInfo: 'Ödeme bilgileri',
    iban: 'IBAN',
    bic: 'BIC',
    reference: 'Referans',
    accountHolder: 'Hesap sahibi',
    payOnline: 'Online öde',
    payOnlineDesc: 'Bu faturayı iDEAL, kredi kartı veya banka havalesi ile online ödeyebilirsiniz.',
    terms: 'Şartlar ve koşullar',
    vehicle: 'Araç',
    kvk: 'Ticaret Sicil',
    btw: 'KDV no.',
    tel: 'Tel',
    page: 'Sayfa',
    draft: 'TASLAK',
  },
};

const ACCENT = '#c41e3a';

export function InvoiceTemplate({ invoice, company: c }: { invoice: InvoiceData; company?: CompanyInfo }) {
  const locale = invoice.locale || 'nl';
  const t = LOCALES[locale] ?? LOCALES.nl;
  const isCreditNote = !!invoice.credit_note_id;
  const isDeposit = invoice.invoice_type === 'deposit';
  const title = isCreditNote ? t.creditNoteTitle : isDeposit ? t.depositTitle : t.title;
  const customer = invoice.customers;

  const companyName = c?.name ?? 'Colourking';
  const legalName = c?.legal_name ?? 'Autospuitbedrijf Colour King';

  return (
    <div className="invoice-template" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", backgroundColor: '#fff', color: '#1a1a2e' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .invoice-template { box-shadow: none !important; margin: 0 !important; max-width: none !important; padding: 32px 40px !important; }
          .no-print { display: none !important; }
        }
        .invoice-template {
          max-width: 210mm;
          margin: 0 auto;
          padding: 48px 56px;
          min-height: 297mm;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .invoice-template table { border-collapse: collapse; }
        .inv-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; }
      `}</style>

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}88)` }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', paddingTop: '8px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#1a1a2e' }}>
            {companyName}
          </div>
          <div style={{ marginTop: '10px', fontSize: '11.5px', lineHeight: '1.8', color: '#5a5a7a' }}>
            {c?.address ?? 'Satijnbloem 6'}<br />
            {c?.postcode ?? '3068 JP'} {c?.city ?? 'Rotterdam'}<br />
            {t.tel}: {c?.phone ?? '06 81 63 10 20'}<br />
            {c?.email ?? 'info@colourking.nl'}
          </div>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#8a8aa0' }}>
            {t.kvk}: {c?.kvk ?? '82199884'} &nbsp;·&nbsp; {t.btw}: {c?.vat_number ?? 'NL003653356B56'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: isCreditNote ? '#b45309' : isDeposit ? '#92400e' : ACCENT,
            marginBottom: '20px',
          }}>
            {title}
          </div>
          <table style={{ fontSize: '12px', marginLeft: 'auto' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 16px 3px 0', color: '#8a8aa0', textAlign: 'left', whiteSpace: 'nowrap' }}>{t.invoiceNumber}</td>
                <td className="inv-mono" style={{ padding: '3px 0', fontWeight: 600, color: '#1a1a2e', textAlign: 'right' }}>
                  {invoice.invoice_number ?? t.draft}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 16px 3px 0', color: '#8a8aa0', textAlign: 'left' }}>{t.invoiceDate}</td>
                <td style={{ padding: '3px 0', color: '#3a3a5a', textAlign: 'right' }}>{fmtDate(invoice.issued_at, locale)}</td>
              </tr>
              {invoice.due_date && !isCreditNote && (
                <tr>
                  <td style={{ padding: '3px 16px 3px 0', color: '#8a8aa0', textAlign: 'left' }}>{t.dueDate}</td>
                  <td style={{ padding: '3px 0', color: '#3a3a5a', fontWeight: 500, textAlign: 'right' }}>{fmtDate(invoice.due_date, locale)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer + Vehicle block */}
      {customer && (
        <div style={{ marginBottom: '28px', display: 'flex', gap: '24px' }}>
          <div style={{
            flex: 1,
            padding: '16px 20px',
            backgroundColor: '#f7f7fb',
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: '0 6px 6px 0',
          }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8aa0', marginBottom: '8px', fontWeight: 600 }}>
              {t.billTo}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>{customer.name}</div>
            {customer.address && <div style={{ fontSize: '12.5px', color: '#5a5a7a', marginTop: '3px' }}>{customer.address}</div>}
            {(customer.postcode || customer.city) && (
              <div style={{ fontSize: '12.5px', color: '#5a5a7a' }}>{customer.postcode} {customer.city}</div>
            )}
            {customer.btw_number && (
              <div style={{ fontSize: '11px', color: '#8a8aa0', marginTop: '6px' }}>{t.btw}: {customer.btw_number}</div>
            )}
            {customer.kvk_number && (
              <div style={{ fontSize: '11px', color: '#8a8aa0' }}>{t.kvk}: {customer.kvk_number}</div>
            )}
          </div>
          {invoice.vehicles && (
            <div style={{ padding: '16px 20px', backgroundColor: '#f7f7fb', borderRadius: '6px', minWidth: '160px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8aa0', marginBottom: '8px', fontWeight: 600 }}>
                {t.vehicle}
              </div>
              <div className="inv-mono" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', letterSpacing: '0.02em' }}>
                {invoice.vehicles.kenteken ?? '—'}
              </div>
              <div style={{ fontSize: '12px', color: '#5a5a7a', marginTop: '2px' }}>
                {[invoice.vehicles.make, invoice.vehicles.model].filter(Boolean).join(' ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line items table */}
      <table style={{ width: '100%', marginBottom: '20px', fontSize: '12.5px' }}>
        <thead>
          <tr>
            {[
              { text: '#', align: 'left' as const, width: '32px' },
              { text: t.description, align: 'left' as const },
              { text: t.quantity, align: 'right' as const, width: '70px' },
              { text: t.unitPrice, align: 'right' as const, width: '90px' },
              { text: t.discount, align: 'right' as const, width: '65px' },
              { text: t.vat, align: 'right' as const, width: '75px' },
              { text: t.total, align: 'right' as const, width: '95px' },
            ].map((col, i) => (
              <th key={i} style={{
                padding: '10px 8px',
                textAlign: col.align,
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#8a8aa0',
                fontWeight: 600,
                borderBottom: `2px solid ${ACCENT}20`,
                width: col.width,
              }}>
                {col.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_lines.map((line, idx) => (
            <tr key={line.id} style={{ borderBottom: '1px solid #f0f0f5' }}>
              <td className="inv-mono" style={{ padding: '9px 8px', color: '#8a8aa0', fontSize: '10px' }}>{idx + 1}</td>
              <td style={{ padding: '9px 8px', color: '#2a2a4a' }}>
                {line.description}
                {line.part_number && (
                  <span className="inv-mono" style={{ marginLeft: '8px', fontSize: '9px', color: '#8a8aa0' }}>{line.part_number}</span>
                )}
              </td>
              <td className="inv-mono" style={{ padding: '9px 8px', textAlign: 'right', fontSize: '11px', color: '#4a4a6a' }}>
                {fmtNumber(Number(line.quantity), locale)} {line.unit}
              </td>
              <td className="inv-mono" style={{ padding: '9px 8px', textAlign: 'right', fontSize: '11px', color: '#4a4a6a' }}>
                {fmtCurrency(line.unit_price_cents, locale)}
              </td>
              <td className="inv-mono" style={{ padding: '9px 8px', textAlign: 'right', fontSize: '11px', color: '#8a8aa0' }}>
                {Number(line.discount_pct) > 0 ? `${fmtNumber(Number(line.discount_pct), locale)}%` : '—'}
              </td>
              <td className="inv-mono" style={{ padding: '9px 8px', textAlign: 'right', fontSize: '11px', color: '#8a8aa0' }}>
                {fmtCurrency(line.vat_amount_cents, locale)}
              </td>
              <td className="inv-mono" style={{ padding: '9px 8px', textAlign: 'right', fontSize: '11.5px', fontWeight: 600, color: '#2a2a4a' }}>
                {fmtCurrency(line.line_total_cents, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + VAT summary */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '28px' }}>
        {/* VAT summary */}
        {invoice.tax_summary && Object.keys(invoice.tax_summary).length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8aa0', marginBottom: '8px', fontWeight: 600 }}>
              {t.vatSummary}
            </div>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e8f0' }}>
                  {[t.taxCode, t.taxRate, t.taxBase, t.taxAmount].map((h, i) => (
                    <th key={i} style={{ padding: '5px 8px', textAlign: i === 0 ? 'left' : 'right', fontSize: '9px', color: '#8a8aa0', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoice.tax_summary).map(([code, val]) => (
                  <tr key={code} style={{ borderBottom: '1px solid #f4f4f8' }}>
                    <td className="inv-mono" style={{ padding: '5px 8px', fontSize: '10px', color: '#4a4a6a' }}>{code}</td>
                    <td className="inv-mono" style={{ padding: '5px 8px', textAlign: 'right', fontSize: '10px', color: '#4a4a6a' }}>{val.rate}%</td>
                    <td className="inv-mono" style={{ padding: '5px 8px', textAlign: 'right', fontSize: '10px', color: '#4a4a6a' }}>{fmtCurrency(val.base_cents, locale)}</td>
                    <td className="inv-mono" style={{ padding: '5px 8px', textAlign: 'right', fontSize: '10px', color: '#4a4a6a' }}>{fmtCurrency(val.vat_cents, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grand total */}
        <div style={{ width: '260px', marginLeft: 'auto' }}>
          <div style={{ borderTop: '1px solid #e8e8f0', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: '#8a8aa0' }}>{t.subtotal}</span>
              <span className="inv-mono" style={{ color: '#4a4a6a' }}>{fmtCurrency(invoice.subtotal_cents, locale)}</span>
            </div>
            {invoice.discount_cents !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
                <span style={{ color: '#8a8aa0' }}>{t.discount}</span>
                <span className="inv-mono" style={{ color: '#dc2626' }}>-{fmtCurrency(Math.abs(invoice.discount_cents), locale)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: '#8a8aa0' }}>{t.vat}</span>
              <span className="inv-mono" style={{ color: '#4a4a6a' }}>{fmtCurrency(invoice.vat_cents, locale)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              marginTop: '8px',
              background: isCreditNote ? '#fff7ed' : `linear-gradient(135deg, ${ACCENT}08, ${ACCENT}15)`,
              border: `1px solid ${isCreditNote ? '#fdba74' : ACCENT}30`,
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
            }}>
              <span style={{ color: isCreditNote ? '#9a3412' : '#1a1a2e' }}>
                {isCreditNote ? t.grandTotalCredit : t.grandTotal}
              </span>
              <span className="inv-mono" style={{ color: isCreditNote ? '#9a3412' : ACCENT, letterSpacing: '0.01em' }}>
                {fmtCurrency(invoice.total_cents, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment information */}
      {!isCreditNote && (
        <div style={{
          marginBottom: '20px',
          padding: '18px 22px',
          border: '1px solid #e8e8f0',
          borderRadius: '8px',
          backgroundColor: '#fcfcfe',
        }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8aa0', marginBottom: '14px', fontWeight: 600 }}>
            {t.paymentInfo}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#8a8aa0', fontSize: '10px', marginBottom: '3px' }}>{t.iban}</div>
              <div className="inv-mono" style={{ fontWeight: 600, color: '#1a1a2e', letterSpacing: '0.03em', fontSize: '12px' }}>
                {c?.iban ?? 'NL12 INGB 0675 6533 04'}
              </div>
            </div>
            <div>
              <div style={{ color: '#8a8aa0', fontSize: '10px', marginBottom: '3px' }}>{t.bic}</div>
              <div className="inv-mono" style={{ fontWeight: 500, color: '#3a3a5a', fontSize: '12px' }}>
                {c?.bic ?? 'INGBNL2A'}
              </div>
            </div>
            <div>
              <div style={{ color: '#8a8aa0', fontSize: '10px', marginBottom: '3px' }}>{t.accountHolder}</div>
              <div style={{ fontWeight: 500, color: '#1a1a2e' }}>{legalName}</div>
            </div>
            <div>
              <div style={{ color: '#8a8aa0', fontSize: '10px', marginBottom: '3px' }}>{t.reference}</div>
              <div className="inv-mono" style={{ fontWeight: 600, color: '#1a1a2e' }}>
                {invoice.invoice_number ?? '—'}
              </div>
            </div>
            {invoice.due_date && (
              <div>
                <div style={{ color: '#8a8aa0', fontSize: '10px', marginBottom: '3px' }}>{t.dueDate}</div>
                <div style={{ fontWeight: 500, color: '#1a1a2e' }}>{fmtDate(invoice.due_date, locale)}</div>
              </div>
            )}
          </div>

          {invoice.payment_token && invoice.status !== 'paid' && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0f0f5', fontSize: '11px', color: '#5a5a7a' }}>
              {t.payOnlineDesc}
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {invoice.terms && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8aa0', marginBottom: '6px', fontWeight: 600 }}>
            {t.terms}
          </div>
          <div style={{ fontSize: '10.5px', color: '#6a6a8a', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {invoice.terms}
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a40' }}>
          <div style={{ fontSize: '10.5px', color: '#92400e', lineHeight: '1.6' }}>{invoice.notes}</div>
        </div>
      )}

      {/* Spacer to push footer down */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{
        paddingTop: '16px',
        borderTop: `1px solid #e8e8f0`,
        fontSize: '9px',
        color: '#a0a0b8',
        textAlign: 'center',
        lineHeight: '1.8',
      }}>
        <div style={{ fontWeight: 500 }}>
          {legalName} &nbsp;·&nbsp; {c?.address ?? 'Satijnbloem 6'}, {c?.postcode ?? '3068 JP'} {c?.city ?? 'Rotterdam'}
        </div>
        <div>
          {t.kvk}: {c?.kvk ?? '82199884'} &nbsp;·&nbsp; {t.btw}: {c?.vat_number ?? 'NL003653356B56'} &nbsp;·&nbsp; IBAN: {c?.iban ?? 'NL12 INGB 0675 6533 04'} &nbsp;·&nbsp; {t.bic}: {c?.bic ?? 'INGBNL2A'}
        </div>
        <div>{c?.email ?? 'info@colourking.nl'} &nbsp;·&nbsp; {c?.phone ?? '06 81 63 10 20'}</div>
      </div>
    </div>
  );
}
