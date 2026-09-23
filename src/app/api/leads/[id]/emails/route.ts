import { NextRequest, NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';
import { getLeadThread } from '@/modules/email/lead-thread';
import { pollInbox, getPollState } from '@/modules/email/imap-poll';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Email conversation for a lead. With ?poll=1 the inbox is checked first
 * (throttled to once per 2 minutes across all users).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (req.nextUrl.searchParams.get('poll') === '1') {
    await pollInbox().catch(e => console.error('[LEAD EMAILS] poll failed:', e));
  }

  const [messages, state] = await Promise.all([getLeadThread(params.id), getPollState()]);
  return NextResponse.json({ messages, lastPolledAt: state.last_polled_at ?? null });
}
