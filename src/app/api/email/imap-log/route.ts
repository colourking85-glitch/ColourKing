import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';
import { getPollState } from '@/modules/email/imap-poll';

export const dynamic = 'force-dynamic';

/** Must match the imap-poll entry in vercel.json (Hobby plan: daily only). */
const CRON_SCHEDULE = '0 8 * * *';

export async function GET() {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [{ data }, state] = await Promise.all([
    admin
      .from('email_log')
      .select('id, direction, entity_type, entity_id, from_email, to_email, subject, snippet, received_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    getPollState(),
  ]);

  return NextResponse.json({
    recentEmails: data ?? [],
    imapConfig: {
      name: 'imap-inbox-poll',
      schedule: CRON_SCHEDULE,
      inbox: process.env.IMAP_USER || 'info@colourking.nl',
      host: `${process.env.IMAP_HOST || 'imappro.zoho.eu'}:${process.env.IMAP_PORT || '993'}`,
    },
    lastPolledAt: state.last_polled_at ?? null,
    lastResult: state.last_result ?? null,
  });
}
