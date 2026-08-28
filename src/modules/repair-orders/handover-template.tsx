import type { HandoverPayload } from './schema';

type Signature = {
  id: string;
  signer_name: string;
  signer_role: string;
  signature_data: string;
  created_at: string;
};

type HandoverData = {
  id: string;
  doc_number: string | null;
  status: string;
  locale: string;
  issued_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  gallery_consent: boolean | null;
  payload: HandoverPayload;
  customers: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  vehicles: {
    kenteken: string | null;
    make: string | null;
    model: string | null;
  } | null;
  signatures: Signature[];
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Date(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type LocaleStrings = Record<string, string>;

const LOCALES: Record<string, LocaleStrings> = {
  nl: {
    title: 'AFLEVERBON',
    docNumber: 'Bonnummer',
    date: 'Datum',
    customer: 'Klant',
    vehicle: 'Voertuig',
    licensePlate: 'Kenteken',
    workSummary: 'Werkzaamheden',
    mileageOut: 'Kilometerstand bij aflevering',
    warranty: 'Garantie',
    returnedItems: 'Teruggegeven onderdelen',
    galleryConsent: 'Toestemming portfolio',
    galleryConsentYes: 'Klant heeft toestemming gegeven voor gebruik van foto\'s in het portfolio.',
    galleryConsentNo: 'Geen toestemming gegeven.',
    signatureCustomer: 'Handtekening klant',
    signatureStaff: 'Handtekening medewerker',
    signedAt: 'Getekend op',
    draft: 'CONCEPT',
    km: 'km',
    tel: 'Tel',
    kvk: 'KvK',
    btw: 'BTW-nr',
    yes: 'Ja',
    no: 'Nee',
  },
  en: {
    title: 'HANDOVER NOTE',
    docNumber: 'Document no.',
    date: 'Date',
    customer: 'Customer',
    vehicle: 'Vehicle',
    licensePlate: 'License plate',
    workSummary: 'Work performed',
    mileageOut: 'Mileage at handover',
    warranty: 'Warranty',
    returnedItems: 'Items returned',
    galleryConsent: 'Portfolio consent',
    galleryConsentYes: 'Customer has given consent for use of photos in portfolio.',
    galleryConsentNo: 'No consent given.',
    signatureCustomer: 'Customer signature',
    signatureStaff: 'Staff signature',
    signedAt: 'Signed on',
    draft: 'DRAFT',
    km: 'km',
    tel: 'Tel',
    kvk: 'CoC',
    btw: 'VAT no.',
    yes: 'Yes',
    no: 'No',
  },
  tr: {
    title: 'TESLİM BELGESİ',
    docNumber: 'Belge no.',
    date: 'Tarih',
    customer: 'Müşteri',
    vehicle: 'Araç',
    licensePlate: 'Plaka',
    workSummary: 'Yapılan işler',
    mileageOut: 'Teslim kilometre',
    warranty: 'Garanti',
    returnedItems: 'İade edilen parçalar',
    galleryConsent: 'Portfolyo izni',
    galleryConsentYes: 'Müşteri fotoğrafların portfolyoda kullanılmasına izin vermiştir.',
    galleryConsentNo: 'İzin verilmedi.',
    signatureCustomer: 'Müşteri imzası',
    signatureStaff: 'Personel imzası',
    signedAt: 'İmza tarihi',
    draft: 'TASLAK',
    km: 'km',
    tel: 'Tel',
    kvk: 'Ticaret Sicil',
    btw: 'KDV no.',
    yes: 'Evet',
    no: 'Hayır',
  },
};

export function HandoverTemplate({ handover }: { handover: HandoverData }) {
  const locale = handover.locale || 'nl';
  const t = LOCALES[locale] ?? LOCALES.nl;
  const p = handover.payload;
  const customer = handover.customers;
  const vehicle = handover.vehicles;
  const isDraft = handover.status === 'draft';

  return (
    <div className="handover-template bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .handover-template { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .no-print { display: none !important; }
        }
        .handover-template {
          max-width: 210mm;
          margin: 0 auto;
          padding: 40px 48px;
          min-height: 297mm;
          position: relative;
        }
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
            {isDraft ? t.draft : t.title}
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: '2', color: '#555' }}>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.docNumber}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#111' }}>
                {handover.doc_number ?? t.draft}
              </span>
            </div>
            <div>
              <span style={{ color: '#999', minWidth: '120px', display: 'inline-block', textAlign: 'left' }}>
                {t.date}
              </span>
              <span>{formatDate(handover.issued_at, locale)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer + Vehicle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {customer && (
          <div style={{ padding: '20px 24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px' }}>
              {t.customer}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{customer.name}</div>
            {customer.address && <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{customer.address}</div>}
            {customer.phone && <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{t.tel}: {customer.phone}</div>}
            {customer.email && <div style={{ fontSize: '12px', color: '#888' }}>{customer.email}</div>}
          </div>
        )}

        {vehicle && (
          <div style={{ padding: '20px 24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px' }}>
              {t.vehicle}
            </div>
            {vehicle.kenteken && (
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                {vehicle.kenteken}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
              {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            </div>
          </div>
        )}
      </div>

      {/* Work summary */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px', fontWeight: 500 }}>
          {t.workSummary}
        </div>
        <div style={{
          padding: '16px 20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.7',
          color: '#333',
          whiteSpace: 'pre-wrap',
        }}>
          {p.work_summary}
        </div>
      </div>

      {/* Mileage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '4px', fontWeight: 500 }}>
            {t.mileageOut}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#111' }}>
            {p.mileage_out > 0 ? `${p.mileage_out.toLocaleString('nl-NL')} ${t.km}` : '—'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '4px', fontWeight: 500 }}>
            {t.galleryConsent}
          </div>
          <div style={{ fontSize: '13px', color: '#333' }}>
            {handover.gallery_consent ? t.galleryConsentYes : t.galleryConsentNo}
          </div>
        </div>
      </div>

      {/* Warranty */}
      {p.warranty_text && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px', fontWeight: 500 }}>
            {t.warranty}
          </div>
          <div style={{
            padding: '16px 20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#333',
            whiteSpace: 'pre-wrap',
          }}>
            {p.warranty_text}
          </div>
        </div>
      )}

      {/* Items returned */}
      {p.items_returned.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '8px', fontWeight: 500 }}>
            {t.returnedItems}
          </div>
          <div style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            {p.items_returned.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                fontSize: '13px',
                color: '#333',
                borderBottom: idx < p.items_returned.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: '40px', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: '16px', fontWeight: 500 }}>
          {t.signatureCustomer}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {handover.signatures.length > 0 ? (
            handover.signatures.map(sig => (
              <div key={sig.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                  {sig.signer_role === 'customer' ? t.signatureCustomer : t.signatureStaff}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sig.signature_data}
                  alt={sig.signer_name}
                  style={{ height: '60px', objectFit: 'contain' }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 500, color: '#111' }}>
                  {sig.signer_name}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {formatDate(sig.created_at, locale)}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '24px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#999',
              fontSize: '12px',
            }}>
              {t.signatureCustomer}
              <div style={{ marginTop: '40px', borderTop: '1px solid #d1d5db', paddingTop: '8px', fontSize: '11px' }}>
                {t.date}: _______________
              </div>
            </div>
          )}
        </div>
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
        <div>info@colourking.nl | 06 81 63 10 20</div>
      </div>
    </div>
  );
}
