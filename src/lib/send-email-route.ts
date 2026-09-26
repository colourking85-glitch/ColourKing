import { NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';
import type { SendOutcome } from '@/modules/email/triggers';

/** Shared handler for staff-triggered customer emails: office/admin only, maps outcome → HTTP. */
export async function handleManualSend(run: () => Promise<SendOutcome>): Promise<NextResponse> {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (staff.role === 'tech') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await run();
  if (result.success) return NextResponse.json({ ok: true, to: result.to });

  const status = result.error === 'no_email' ? 422 : result.error === 'not_found' ? 404 : result.error === 'draft' ? 409 : 502;
  return NextResponse.json({ error: result.error ?? 'send_failed' }, { status });
}
