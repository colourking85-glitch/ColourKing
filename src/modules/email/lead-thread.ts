/**
 * Two-way email conversation with a lead's customer.
 *
 * Outgoing emails carry an [LD-0018] tag in the subject and are logged to
 * email_log (direction='outbound') with their Message-ID. The IMAP poller
 * matches customer replies back to the lead by that tag or by In-Reply-To.
 */

import { admin as supabase } from '@/lib/supabase/admin';
import { sendEmail } from './sender';
import { renderMessage } from './templates';
import type { EmailLocale } from './schema';
import { getCompanyInfo } from '@/lib/company';
import { getSender } from '@/lib/email-identity';

const LOCALES: EmailLocale[] = ['nl', 'en', 'tr'];

const DEFAULT_SUBJECT: Record<EmailLocale, string> = {
  nl: 'Uw aanvraag bij Colourking',
  en: 'Your request at Colourking',
  tr: 'Colourking talebiniz',
};

export function leadTag(number: number): string {
  return `[LD-${String(number).padStart(4, '0')}]`;
}

/** Ensure the subject carries the lead tag exactly once. */
export function withLeadTag(subject: string, number: number): string {
  const tag = leadTag(number);
  const clean = subject.replace(/\[LD-#?\d{1,10}\]/gi, '').replace(/\s{2,}/g, ' ').trim();
  return `${tag} ${clean}`.trim();
}

/**
 * Keep only the new part of a reply: drop quoted lines ("> ...") and
 * everything from the usual "On ... wrote:" / "Op ... schreef:" markers.
 */
export function extractReply(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (/^(on|op|am|le)\s.+\b(wrote|schreef|schrieb|a écrit)\b.*:\s*$/i.test(l)) break;
    if (/^-{2,}\s*(original message|oorspronkelijk bericht|forwarded message)/i.test(l)) break;
    if (/^(from|van|von):\s/i.test(l) && out.length > 0) break;
    if (l.startsWith('>')) continue;
    out.push(line);
  }
  return out.join('\n').trim();
}

export type ThreadMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  to_email: string | null;
  subject: string | null;
  body: string;
  /** Full inbound email including quoted history, when it differs from body */
  full: string | null;
  at: string;
};

type SendLeadEmailInput = {
  leadId: string;
  message: string;
  subject?: string;
  sentBy?: string | null;
};

type SendLeadEmailResult =
  | { ok: true; entry: ThreadMessage }
  | { ok: false; status: number; error: string };

export async function sendLeadEmail(input: SendLeadEmailInput): Promise<SendLeadEmailResult> {
  const { data: lead } = await supabase
    .from('leads')
    .select('id, number, contact_email, locale, deleted_at')
    .eq('id', input.leadId)
    .maybeSingle();

  if (!lead || lead.deleted_at) return { ok: false, status: 404, error: 'Lead not found' };
  if (!lead.contact_email) return { ok: false, status: 400, error: 'Lead has no email address' };

  const locale: EmailLocale = LOCALES.includes(lead.locale as EmailLocale) ? (lead.locale as EmailLocale) : 'nl';

  // Thread onto the latest message in the conversation, if any
  const { data: last } = await supabase
    .from('email_log')
    .select('message_id, subject')
    .eq('entity_type', 'lead')
    .eq('entity_id', lead.id)
    .not('message_id', 'is', null)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseSubject = input.subject?.trim()
    || (last?.subject ? `Re: ${last.subject.replace(/^(re|aw|antw):\s*/i, '')}` : DEFAULT_SUBJECT[locale]);
  const subject = withLeadTag(baseSubject, lead.number);

  const company = await getCompanyInfo();
  const sender = await getSender('leads');
  const result = await sendEmail(lead.contact_email, subject, renderMessage(input.message, locale, company), {
    ...sender,
    text: input.message.trim(),
    ...(last?.message_id ? { inReplyTo: last.message_id, references: [last.message_id] } : {}),
  });

  if (!result.success) return { ok: false, status: 502, error: result.error ?? 'Email could not be sent' };

  const sentAt = new Date().toISOString();
  const fromEmail = sender.from ?? process.env.EMAIL_FROM ?? 'Colourking <sales@colourking.nl>';

  const { data: row, error } = await supabase
    .from('email_log')
    .insert({
      entity_type: 'lead',
      entity_id: lead.id,
      direction: 'outbound',
      from_email: fromEmail,
      to_email: lead.contact_email,
      subject,
      body_text: input.message.trim(),
      snippet: input.message.trim().slice(0, 500),
      message_id: result.messageId ?? null,
      in_reply_to: last?.message_id ?? null,
      received_at: sentAt,
      sent_by: input.sentBy ?? null,
    })
    .select('id')
    .single();

  if (error) console.error('[LEAD EMAIL] Sent but failed to log:', error.message);

  return {
    ok: true,
    entry: {
      id: row?.id ?? `sent-${sentAt}`,
      direction: 'outbound',
      from_email: fromEmail,
      to_email: lead.contact_email,
      subject,
      body: input.message.trim(),
      full: null,
      at: sentAt,
    },
  };
}

/** Full conversation for a lead, oldest first. */
export async function getLeadThread(leadId: string): Promise<ThreadMessage[]> {
  const { data } = await supabase
    .from('email_log')
    .select('id, direction, from_email, to_email, subject, body_text, snippet, received_at, created_at')
    .eq('entity_type', 'lead')
    .eq('entity_id', leadId)
    .order('received_at', { ascending: true, nullsFirst: false });

  return (data ?? []).map(r => ({
    id: r.id,
    direction: r.direction === 'outbound' ? 'outbound' : 'inbound',
    from_email: r.from_email,
    to_email: r.to_email,
    subject: r.subject,
    body: r.direction === 'outbound'
      ? (r.body_text ?? r.snippet ?? '')
      : (r.snippet ?? r.body_text ?? ''),
    full: r.direction !== 'outbound' && r.body_text && r.body_text !== r.snippet ? r.body_text : null,
    at: r.received_at ?? r.created_at,
  }));
}
