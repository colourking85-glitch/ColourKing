import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStaffUser } from '@/lib/supabase/staff';
import { getSender, EMAIL_PURPOSES } from '@/lib/email-identity';
import { sendEmail } from '@/modules/email/sender';
import { renderMessage } from '@/modules/email/templates';
import { getCompanyInfo } from '@/lib/company';
import { logEmail } from '@/modules/email/log';

export const dynamic = 'force-dynamic';

const Body = z.object({
  purpose: z.enum(EMAIL_PURPOSES),
  to: z.string().email(),
});

/** Sends a one-line test mail through the identity for `purpose`, so Zoho alias problems surface immediately. */
export async function POST(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff || staff.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const sender = await getSender(parsed.data.purpose);
  const company = await getCompanyInfo();
  const html = renderMessage(`Testbericht voor afzender "${parsed.data.purpose}".\n\nVerzonden vanaf: ${sender.from ?? '(standaard)'}`, 'nl', company);
  const subject = `[TEST] Colourking afzender: ${parsed.data.purpose}`;
  const result = await sendEmail(parsed.data.to, subject, html, sender);

  await logEmail({
    to: parsed.data.to,
    subject,
    template: 'test',
    locale: 'nl',
    ref_type: 'test',
    ref_id: null,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    from: sender.from,
    messageId: result.messageId,
  });

  return NextResponse.json({ ...result, from: sender.from ?? null }, { status: result.success ? 200 : 502 });
}
