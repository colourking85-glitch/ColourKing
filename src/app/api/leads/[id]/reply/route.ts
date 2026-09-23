import { NextRequest, NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';
import { sendLeadEmail } from '@/modules/email/lead-thread';

/** Email the lead's customer. Subject gets the [LD-xxxx] tag so replies are captured. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { message, subject } = await req.json().catch(() => ({}));
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const result = await sendLeadEmail({
    leadId: params.id,
    message,
    subject: typeof subject === 'string' ? subject : undefined,
    sentBy: staff.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, entry: result.entry });
}
