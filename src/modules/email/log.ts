/**
 * Communication log — stores sent email records in the notifications table.
 */

import { createClient } from '@/lib/supabase/server';
import type { EmailLogInput } from './schema';

/**
 * Log an email event to the notifications table for audit trail.
 * Uses ref_type='email' to distinguish from other notification types.
 */
export async function logEmail(entry: EmailLogInput): Promise<void> {
  const supabase = createClient();

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
