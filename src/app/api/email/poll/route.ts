import { NextRequest, NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';
import { pollInbox } from '@/modules/email/imap-poll';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Staff-triggered inbox poll (monitor, SY25 "Poll now"). Replaces the old
 * browser-side call that needed the poll secret. { force: true } lowers the
 * throttle to 15 seconds.
 */
export async function POST(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { force } = await req.json().catch(() => ({}));
  const result = await pollInbox({ minIntervalMs: force ? 15_000 : undefined });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
