/**
 * Communication log — every outbound template email is written to email_log
 * (direction=outbound, so SY25 shows both directions) and mirrored as a
 * notification row for the bell.
 */

import { admin as supabase } from '@/lib/supabase/admin';
import type { EmailLogInput } from './schema';

export async function logEmail(entry: EmailLogInput & { from?: string; messageId?: string | null }): Promise<void> {
  if (entry.status !== 'dry_run') {
    const { error: logErr } = await supabase.from('email_log').insert({
      entity_type: entry.ref_type ?? 'system',
      entity_id: entry.ref_id ?? null,
      direction: 'outbound',
      from_email: entry.from ?? process.env.EMAIL_FROM ?? 'Colourking <sales@colourking.nl>',
      to_email: entry.to,
      subject: entry.subject,
      snippet: `[${entry.template}] ${entry.status}${entry.error ? `: ${entry.error}` : ''}`,
      message_id: entry.messageId ?? null,
      received_at: new Date().toISOString(),
    });
    if (logErr) console.error('[EMAIL LOG] email_log insert failed:', logErr.message);
  }

  const { error } = await supabase.from('notifications').insert({
    type: 'new_email' as const,
    title: `[${entry.status.toUpperCase()}] ${entry.subject}`,
    body: `To: ${entry.to} | Template: ${entry.template} | Locale: ${entry.locale}${entry.error ? ` | Error: ${entry.error}` : ''}`,
    ref_type: 'email',
    ref_id: entry.ref_id ?? null,
    staff_id: null,
    link: null,
  });

  if (error) {
    console.error('[EMAIL LOG] Failed to log email:', error.message);
  }
}
