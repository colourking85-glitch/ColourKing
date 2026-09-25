import { admin } from '@/lib/supabase/admin';

export type CompanyInfo = {
  name: string;
  legal_name: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  kvk: string;
  vat_number: string;
  iban: string;
  bic: string;
  bank_name: string;
  payment_terms_days: number;
  quote_validity_days: number;
  default_invoice_notes: string;
};

const DEFAULTS: CompanyInfo = {
  name: 'Colourking',
  legal_name: 'Autospuitbedrijf Colour King',
  address: 'Satijnbloem 6',
  postcode: '3068 JP',
  city: 'Rotterdam',
  country: 'NL',
  phone: '06 81 63 10 20',
  email: 'info@colourking.nl',
  website: 'https://www.colourking.nl',
  kvk: '82199884',
  vat_number: 'NL003653356B56',
  iban: 'NL12 INGB 0675 6533 04',
  bic: 'INGBNL2A',
  bank_name: 'ING Bank',
  payment_terms_days: 14,
  quote_validity_days: 30,
  default_invoice_notes: '',
};

let cached: CompanyInfo | null = null;
let cachedAt = 0;
const TTL = 60_000;

export async function getCompanyInfo(): Promise<CompanyInfo> {
  if (cached && Date.now() - cachedAt < TTL) return cached;

  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'company')
      .single();

    const raw = (data?.value ?? {}) as Partial<CompanyInfo>;
    cached = { ...DEFAULTS, ...raw };
    cachedAt = Date.now();
    return cached;
  } catch {
    return DEFAULTS;
  }
}

export function invalidateCompanyCache() {
  cached = null;
  cachedAt = 0;
}

export function formatCompanyFooter(c: CompanyInfo, locale: string): string {
  const kvkLabel = locale === 'en' ? 'CoC' : locale === 'tr' ? 'Ticaret Sicil' : 'KvK';
  const vatLabel = locale === 'en' ? 'VAT' : locale === 'tr' ? 'KDV' : 'BTW';
  return `${c.legal_name} | ${c.address}, ${c.postcode} ${c.city} | ${kvkLabel}: ${c.kvk} | ${vatLabel}: ${c.vat_number}`;
}
