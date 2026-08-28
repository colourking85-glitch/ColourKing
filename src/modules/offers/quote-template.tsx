import type { OfferLineKind, TaxCode } from '@/types/database';

type QuoteLine = {
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

type QuoteData = {
  id: string;
  type: string;
  status: string;
  offer_number: string | null;
  locale: string;
  valid_until: string | null;
  notes: string | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  sent_at: string | null;
  created_at: string;
  customers: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    postcode: string | null;
    city: string | null;
    kvk_number: string | null;
    btw_number: string | null;
  } | null;
  vehicles: {
    kenteken: string | null;
    make: string | null;
    model: string | null;
  } | null;
  offer_lines: QuoteLine[];
};

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

type LocaleStrings = Record<string, string>;

const LOCALES: Record<string, LocaleStrings> = {
  nl: {
    title: 'OFFERTE',
    supplementTitle: 'SUPPLEMENT',
    offerNumber: 'Offertenummer',
    offerDate: 'Offertedatum',
    validUntil: 'Geldig tot',
    billTo: 'Klantgegevens',
    description: 'Omschrijving',
    quantity: 'Aantal',
    unitPrice: 'Stukprijs',
    discount: 'Korting',
    vat: 'BTW',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    grandTotal: 'Totaal incl. BTW',
    vehicle: 'Voertuig',
    notes: 'Opmerkingen',
    draft: 'CONCEPT',
    kvk: 'KvK',
    btw: 'BTW-nr',
    tel: 'Tel',
    labour: 'Arbeid',
    part: 'Onderdeel',
    material: 'Materiaal',
    other: 'Overig',
    acceptNote: 'Deze offerte is geldig tot de bovengenoemde datum. Neem contact met ons op om de werkzaamheden in te plannen.',
  },
  en: {
    title: 'QUOTATION',
    supplementTitle: 'SUPPLEMENT',
    offerNumber: 'Quote number',
    offerDate: 'Quote date',
    validUntil: 'Valid until',
    billTo: 'Customer details',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    discount: 'Discount',
    vat: 'VAT',
    total: 'Total',
    subtotal: 'Subtotal',
    grandTotal: 'Total incl. VAT',
    vehicle: 'Vehicle',
    notes: 'Notes',
    draft: 'DRAFT',
    kvk: 'CoC',
    btw: 'VAT no.',
    tel: 'Tel',
    labour: 'Labour',
    part: 'Part',
    material: 'Material',
    other: 'Other',
    acceptNote: 'This quotation is valid until the date stated above. Please contact us to schedule the work.',
  },
  tr: {
    title: 'TEKLİF',
    supplementTitle: 'EK TEKLİF',
    offerNumber: 'Teklif numarası',
    offerDate: 'Teklif tarihi',
    validUntil: 'Geçerlilik tarihi',
    billTo: 'Müşteri bilgileri',
    description: 'Açıklama',
    quantity: 'Miktar',
    unitPrice: 'Birim fiyat',
    discount: 'İndirim',
    vat: 'KDV',
    total: 'Toplam',
    subtotal: 'Ara toplam',
    grandTotal: 'KDV dahil toplam',
    vehicle: 'Araç',
    notes: 'Notlar',
    draft: 'TASLAK',
    kvk: 'Ticaret Sicil',
    btw: 'KDV no.',
    tel: 'Tel',
    labour: 'İşçilik',
    part: 'Parça',
    material: 'Malzeme',
    other: 'Diğer',
    acceptNote: 'Bu teklif yukarıda belirtilen tarihe kadar geçerlidir. Çalışmaları planlamak için bizimle iletişime geçin.',
  },
};

const KIND_COLORS: Record<OfferLineKind, string> = {
  labour: '#3b82f6',
  part: '#8b5cf6',
  material: '#f59e0b',
  other: '#6b7280',
};

export function QuoteTemplate({ quote }: { quote: QuoteData }) {
  const locale = quote.locale || 'nl';
  const t = LOCALES[locale] ?? LOCALES.nl;
  const isDraft = quote.status === 'draft';
  const isSupplement = quote.type === 'supplement';
  const title = isSupplement ? t.supplementTitle : t.title;

  const customer = quote.customers;

  return (
    <div className="quote-template bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .quote-template { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .no-print { display: none !important; }
        }
        .quote-template {
          max-width: 210mm;
          margin: 0 auto;
          padding: 40px 48px;
          min-height: 297mm;
          position: relative;
        }
        .quote-template table { border-collapse: collapse; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', marginBottom: '40px' }}>
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
            <span>{t.kvk}: 82199884</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>{t.btw}: NL821998840B03</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: isDraft ? '#999' : '#111',
          }}>
            {isDraft ? t.draft : title}
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: '2', color: '#555' }}>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.offerNumber}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#111' }}>
                {quote.offer_number ?? t.draft}
              </span>
            </div>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.offerDate}
              </span>
              <span>{formatDate(quote.sent_at ?? quote.created_at, locale)}</span>
            </div>
            {quote.valid_until && (
              <div>
                <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                  {t.validUntil}
                </span>
                <span style={{ fontWeight: 500 }}>{formatDate(quote.valid_until, locale)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer + Vehicle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {customer && (
          <div style={{ padding: '20px 24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px' }}>
              {t.billTo}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{customer.name}</div>
            {customer.address && <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{customer.address}</div>}
            {(customer.postcode || customer.city) && (
              <div style={{ fontSize: '13px', color: '#555' }}>
                {customer.postcode} {customer.city}
              </div>
            )}
            {customer.btw_number && (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{t.btw}: {customer.btw_number}</div>
            )}
            {customer.kvk_number && (
              <div style={{ fontSize: '12px', color: '#888' }}>{t.kvk}: {customer.kvk_number}</div>
            )}
          </div>
        )}

        {quote.vehicles && (
          <div style={{ padding: '20px 24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px' }}>
              {t.vehicle}
            </div>
            {quote.vehicles.kenteken && (
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                {quote.vehicles.kenteken}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
              {[quote.vehicles.make, quote.vehicles.model].filter(Boolean).join(' ')}
            </div>
          </div>
        )}
      </div>

      {/* Line items */}
      <table style={{ width: '100%', marginBottom: '24px', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 500, width: '24px' }}>
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
          {quote.offer_lines.map((line, idx) => (
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
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: KIND_COLORS[line.kind] ?? '#6b7280',
                  marginRight: '8px',
                  verticalAlign: 'middle',
                }} />
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

      {/* Kind legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontSize: '10px', color: '#999' }}>
        {(['labour', 'part', 'material', 'other'] as OfferLineKind[]).map(kind => (
          <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: KIND_COLORS[kind],
            }} />
            {t[kind]}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <div style={{ width: '280px' }}>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>{t.subtotal}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
                {formatCurrency(quote.subtotal_cents, locale)}
              </span>
            </div>
            {quote.discount_cents !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>{t.discount}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#dc2626' }}>
                  -{formatCurrency(Math.abs(quote.discount_cents), locale)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>{t.vat}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
                {formatCurrency(quote.vat_cents, locale)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              marginTop: '8px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
            }}>
              <span style={{ color: '#0c4a6e' }}>{t.grandTotal}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0c4a6e' }}>
                {formatCurrency(quote.total_cents, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '6px', fontWeight: 500 }}>
            {t.notes}
          </div>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {quote.notes}
          </div>
        </div>
      )}

      {/* Acceptance note */}
      <div style={{
        marginBottom: '24px',
        padding: '16px 20px',
        backgroundColor: '#fffbeb',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#92400e',
        lineHeight: '1.6',
      }}>
        {t.acceptNote}
      </div>

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
        <div>Autospuitbedrijf Colour King | Satijnbloem 6, 3068 JP Rotterdam | {t.kvk}: 82199884 | {t.btw}: NL821998840B03</div>
        <div>IBAN: NL00 INGB 0000 0000 00 | BIC: INGBNL2A | info@colourking.nl | 06 81 63 10 20</div>
      </div>
    </div>
  );
}
