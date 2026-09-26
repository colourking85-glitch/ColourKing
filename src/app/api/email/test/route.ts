import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { sendEmail } from '@/modules/email/sender';
import { logEmail } from '@/modules/email/log';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronAuth = req.headers.get('authorization');
  const secret = req.nextUrl.searchParams.get('secret');
  const isCronValid =
    cronAuth && process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`;
  const isSecretValid = secret && process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (!isCronValid && !isSecretValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics: Record<string, unknown> = {};

  // 1. Check env vars
  diagnostics.smtpUser = process.env.SMTP_USER ?? process.env.IMAP_USER ?? 'info@colourking.nl';
  diagnostics.smtpPassSet = !!(process.env.SMTP_PASS ?? process.env.IMAP_PASS);
  diagnostics.smtpHost = process.env.SMTP_HOST ?? 'smtp.zoho.eu';
  diagnostics.shopEmail = process.env.SHOP_EMAIL ?? '(not set, fallback: colourking85@gmail.com)';
  diagnostics.emailFrom = process.env.EMAIL_FROM ?? `(not set, fallback: Colourking <${diagnostics.smtpUser}>)`;

  // 2. Check staff table
  const { data: staff, error: staffErr } = await admin
    .from('staff')
    .select('id, name, email, role, active')
    .in('role', ['admin', 'office'])
    .eq('active', true);

  diagnostics.staffQuery = staffErr ? { error: staffErr.message } : { count: staff?.length ?? 0, rows: staff };

  // 3. Test send to the target email
  const targetEmail = req.nextUrl.searchParams.get('to') ?? 'colourking85@gmail.com';
  diagnostics.targetEmail = targetEmail;

  const result = await sendEmail(
    targetEmail,
    'Colourking Email Test',
    `<h1>Email Test</h1><p>This is a diagnostic test from <strong>Colourking</strong> at ${new Date().toISOString()}.</p><p>If you see this, Zoho SMTP is working.</p>`,
  );

  diagnostics.sendResult = result;

  await logEmail({
    to: targetEmail,
    subject: 'Colourking Email Test',
    template: 'test',
    locale: 'nl',
    ref_type: 'test',
    ref_id: null,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    messageId: result.messageId,
  });

  return NextResponse.json({ ok: result.success, diagnostics });
}
