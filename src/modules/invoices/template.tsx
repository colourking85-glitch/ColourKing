/**
 * Professional invoice HTML template for ColourKing.
 * Print-ready, locale-aware, A4 proportions.
 * Renders as a React component — can be printed or exported to PDF.
 */

import type { TaxCode, OfferLineKind } from '@/types/database';

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

// Locale-aware formatting helpers
function formatCurrency(cents: number, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Date(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatNumber(n: number, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.NumberFormat(loc, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

// Locale strings
type LocaleStrings = Record<string, string>;

const LOCALES: Record<string, LocaleStrings> = {
  nl: {
    title: 'FACTUUR',
    creditNoteTitle: 'CREDITNOTA',
    invoiceNumber: 'Factuurnummer',
    invoiceDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    customerRef: 'Klantreferentie',
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
    reference: 'Referentie',
    payOnline: 'Betaal online',
    payOnlineDesc: 'U kunt deze factuur ook online betalen via iDEAL, creditcard of overboeking.',
    terms: 'Voorwaarden',
    vehicle: 'Voertuig',
    kvk: 'KvK',
    btw: 'BTW-nr',
    tel: 'Tel',
    page: 'Pagina',
  },
  en: {
    title: 'INVOICE',
    creditNoteTitle: 'CREDIT NOTE',
    invoiceNumber: 'Invoice number',
    invoiceDate: 'Invoice date',
    dueDate: 'Due date',
    customerRef: 'Customer reference',
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
    reference: 'Reference',
    payOnline: 'Pay online',
    payOnlineDesc: 'You can also pay this invoice online via iDEAL, credit card or bank transfer.',
    terms: 'Terms & conditions',
    vehicle: 'Vehicle',
    kvk: 'CoC',
    btw: 'VAT no.',
    tel: 'Tel',
    page: 'Page',
  },
  tr: {
    title: 'FATURA',
    creditNoteTitle: 'ALACAK DEKONTU',
    invoiceNumber: 'Fatura numarasi',
    invoiceDate: 'Fatura tarihi',
    dueDate: 'Son odeme tarihi',
    customerRef: 'Musteri referansi',
    description: 'Aciklama',
    quantity: 'Miktar',
    unitPrice: 'Birim fiyat',
    discount: 'Indirim',
    vat: 'KDV',
    total: 'Toplam',
    subtotal: 'Ara toplam',
    vatSummary: 'KDV detayi',
    taxCode: 'Kod',
    taxBase: 'Matrah',
    taxRate: 'Oran',
    taxAmount: 'Tutar',
    grandTotal: 'Odenecek toplam',
    grandTotalCredit: 'Toplam alacak',
    paymentInfo: 'Odeme bilgileri',
    iban: 'IBAN',
    reference: 'Referans',
    payOnline: 'Online ode',
    payOnlineDesc: 'Bu faturayi iDEAL, kredi karti veya banka havalesi ile online odeyebilirsiniz.',
    terms: 'Sartlar ve kosullar',
    vehicle: 'Arac',
    kvk: 'Ticaret Sicil',
    btw: 'KDV no.',
    tel: 'Tel',
    page: 'Sayfa',
  },
};

export function InvoiceTemplate({ invoice }: { invoice: InvoiceData }) {
  const locale = invoice.locale || 'nl';
  const t = LOCALES[locale] ?? LOCALES.nl;
  const isCreditNote = !!invoice.credit_note_id;
  const title = isCreditNote ? t.creditNoteTitle : t.title;

  const customer = invoice.customers;

  return (
    <div className="invoice-template bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .invoice-template { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .no-print { display: none !important; }
        }
        .invoice-template {
          max-width: 210mm;
          margin: 0 auto;
          padding: 40px 48px;
          min-height: 297mm;
          position: relative;
        }
        .invoice-template table { border-collapse: collapse; }
      `}</style>

      {/* Header: company + title */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', marginBottom: '40px' }}>
        {/* Company info */}
        <div>
          <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: '#111' }}>
            Colourking
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.7', color: '#555' }}>
            <div>Satijnbloem 6</div>
            <div>3068 JP Rotterdam</div>
            <div>{t.tel}: 06 81 63 10 20</div>
            <div>info@colourking.nl</div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
            <span>{t.kvk}: 62022043</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>{t.btw}: NL620220430B03</span>
          </div>
        </div>

        {/* Title + metadata */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: isCreditNote ? '#c2410c' : '#111',
          }}>
            {title}
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: '2', color: '#555' }}>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.invoiceNumber}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#111' }}>
                {invoice.invoice_number ?? 'CONCEPT'}
              </span>
            </div>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.invoiceDate}
              </span>
              <span>{formatDate(invoice.issued_at, locale)}</span>
            </div>
            {invoice.due_date && !isCreditNote && (
              <div>
                <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                  {t.dueDate}
                </span>
                <span>{formatDate(invoice.due_date, locale)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer address block */}
      {customer && (
        <div style={{
          marginBottom: '32px',
          padding: '20px 24px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px' }}>
            {locale === 'nl' ? 'Factuuradres' : locale === 'tr' ? 'Fatura adresi' : 'Bill to'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{customer.name}</div>
          {customer.address && <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{customer.address}</div>}
          {(customer.postcode || customer.city) && (
            <div style={{ fontSize: '13px', color: '#555' }}>
              {customer.postcode} {customer.city}
            </div>
          )}
          {customer.btw_number && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
              {t.btw}: {customer.btw_number}
            </div>
          )}
          {customer.kvk_number && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              {t.kvk}: {customer.kvk_number}
            </div>
          )}
          {invoice.vehicles && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
              {t.vehicle}: {invoice.vehicles.kenteken ?? `${invoice.vehicles.make ?? ''} ${invoice.vehicles.model ?? ''}`}
            </div>
          )}
        </div>
      )}

      {/* Line items table */}
      <table style={{ width: '100%', marginBottom: '24px', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              #
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.description}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.quantity}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.unitPrice}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.discount}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.vat}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500 }}>
              {t.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_lines.map((line, idx) => (
            <tr
              key={line.id}
              style={{
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: idx % 2 === 1 ? '#fafbfc' : 'transparent',
              }}
            >
              <td style={{ padding: '10px 8px', color: '#999', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                {idx + 1}
              </td>
              <td style={{ padding: '10px 8px', color: '#333' }}>
                {line.description}
                {line.part_number && (
                  <span style={{ marginLeft: '8px', fontSize: '10px', color: '#999', fontFamily: 'JetBrains Mono, monospace' }}>
                    {line.part_number}
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#555' }}>
                {formatNumber(Number(line.quantity), locale)} {line.unit}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#555' }}>
                {formatCurrency(line.unit_price_cents, locale)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#999' }}>
                {Number(line.discount_pct) > 0 ? `${formatNumber(Number(line.discount_pct), locale)}%` : '—'}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#999' }}>
                {formatCurrency(line.vat_amount_cents, locale)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, color: '#333' }}>
                {formatCurrency(line.line_total_cents, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', marginBottom: '32px' }}>
        {/* VAT summary (left) */}
        {invoice.tax_summary && Object.keys(invoice.tax_summary).length > 0 && (
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px', fontWeight: 500 }}>
              {t.vatSummary}
            </div>
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: '#999', fontWeight: 500 }}>{t.taxCode}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#999', fontWeight: 500 }}>{t.taxRate}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#999', fontWeight: 500 }}>{t.taxBase}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#999', fontWeight: 500 }}>{t.taxAmount}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoice.tax_summary).map(([code, val]) => (
                  <tr key={code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#555' }}>
                      {code}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#555' }}>
                      {val.rate}%
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#555' }}>
                      {formatCurrency(val.base_cents, locale)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#555' }}>
                      {formatCurrency(val.vat_cents, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grand total (right) */}
        <div>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>{t.subtotal}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
                {formatCurrency(invoice.subtotal_cents, locale)}
              </span>
            </div>
            {invoice.discount_cents !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>{t.discount}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#dc2626' }}>
                  -{formatCurrency(Math.abs(invoice.discount_cents), locale)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>{t.vat}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
                {formatCurrency(invoice.vat_cents, locale)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              marginTop: '8px',
              backgroundColor: isCreditNote ? '#fff7ed' : '#f0fdf4',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
            }}>
              <span style={{ color: isCreditNote ? '#9a3412' : '#166534' }}>
                {isCreditNote ? t.grandTotalCredit : t.grandTotal}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                color: isCreditNote ? '#9a3412' : '#166534',
              }}>
                {formatCurrency(invoice.total_cents, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment information */}
      {!isCreditNote && (
        <div style={{
          marginBottom: '24px',
          padding: '20px 24px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '12px', fontWeight: 500 }}>
            {t.paymentInfo}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>{t.iban}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#111', letterSpacing: '0.02em' }}>
                NL00 INGB 0000 0000 00
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>{t.reference}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#111' }}>
                {invoice.invoice_number ?? '—'}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>
                {locale === 'nl' ? 'Ten name van' : locale === 'tr' ? 'Hesap sahibi' : 'Account holder'}
              </div>
              <div style={{ fontWeight: 500, color: '#111' }}>Colourking B.V.</div>
            </div>
            {invoice.due_date && (
              <div>
                <div style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}>{t.dueDate}</div>
                <div style={{ fontWeight: 500, color: '#111' }}>{formatDate(invoice.due_date, locale)}</div>
              </div>
            )}
          </div>

          {/* Online payment button */}
          {invoice.payment_token && invoice.status !== 'paid' && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {t.payOnlineDesc}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {invoice.terms && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
            {t.terms}
          </div>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {invoice.terms}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '24px',
        borderTop: '1px solid #f3f4f6',
        fontSize: '10px',
        color: '#bbb',
        textAlign: 'center',
        lineHeight: '1.6',
      }}>
        <div>Colourking B.V. | Satijnbloem 6, 3068 JP Rotterdam | {t.kvk}: 62022043 | {t.btw}: NL620220430B03</div>
        <div>IBAN: NL00 INGB 0000 0000 00 | BIC: INGBNL2A | info@colourking.nl | 06 81 63 10 20</div>
      </div>
    </div>
  );
}
