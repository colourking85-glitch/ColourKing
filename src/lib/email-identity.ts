import { admin } from '@/lib/supabase/admin';

export const EMAIL_PURPOSES = ['default', 'offers', 'invoices', 'appointments', 'workshop', 'leads'] as const;
export type EmailPurpose = (typeof EMAIL_PURPOSES)[number];

export type EmailIdentity = {
  from_name: string;
  from_email: string;
  reply_to: string;
  bcc: string;
  enabled: boolean;
};

export type EmailIdentities = Record<EmailPurpose, EmailIdentity>;

export const IDENTITY_DEFAULTS: EmailIdentities = {
  default:      { from_name: 'Colourking',            from_email: 'info@colourking.nl',     reply_to: '', bcc: '', enabled: true },
  offers:       { from_name: 'Colourking Offertes',   from_email: 'offer@colourking.nl',    reply_to: '', bcc: '', enabled: true },
  invoices:     { from_name: 'Colourking Facturatie', from_email: 'invoice@colourking.nl',  reply_to: '', bcc: '', enabled: true },
  appointments: { from_name: 'Colourking Planning',   from_email: 'planning@colourking.nl', reply_to: '', bcc: '', enabled: true },
  workshop:     { from_name: 'Colourking Werkplaats', from_email: 'customer@colourking.nl', reply_to: '', bcc: '', enabled: true },
  leads:        { from_name: 'Colourking',            from_email: 'info@colourking.nl',     reply_to: '', bcc: '', enabled: true },
};

let cached: EmailIdentities | null = null;
let cachedAt = 0;
const TTL = 60_000;

export async function getEmailIdentities(): Promise<EmailIdentities> {
  if (cached && Date.now() - cachedAt < TTL) return cached;
  try {
    const { data } = await admin.from('settings').select('value').eq('key', 'email_identities').single();
    const raw = (data?.value ?? {}) as Partial<Record<EmailPurpose, Partial<EmailIdentity>>>;
    const merged = {} as EmailIdentities;
    for (const p of EMAIL_PURPOSES) merged[p] = { ...IDENTITY_DEFAULTS[p], ...(raw[p] ?? {}) };
    cached = merged;
    cachedAt = Date.now();
    return merged;
  } catch {
    return IDENTITY_DEFAULTS;
  }
}

export function invalidateIdentityCache() {
  cached = null;
  cachedAt = 0;
}

function formatAddress(id: EmailIdentity): string {
  return id.from_name ? `${id.from_name} <${id.from_email}>` : id.from_email;
}

/** From/reply-to for a purpose; falls back to `default`, then to the env vars used by the sender. */
export async function getSender(purpose: EmailPurpose): Promise<{ from?: string; replyTo?: string; bcc?: string[] }> {
  const ids = await getEmailIdentities();
  const pick = ids[purpose]?.enabled && ids[purpose].from_email ? ids[purpose] : ids.default;
  if (!pick?.enabled || !pick.from_email) return {};
  return {
    from: formatAddress(pick),
    ...(pick.reply_to ? { replyTo: pick.reply_to } : {}),
    ...(pick.bcc ? { bcc: [pick.bcc] } : {}),
  };
}
