import { NextRequest, NextResponse } from 'next/server';
import { pollInbox } from '@/modules/email/imap-poll';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scheduled inbox poll. Called by the Vercel cron (Authorization: Bearer
 * CRON_SECRET) or an external scheduler (x-poll-secret / ?secret=
 * IMAP_POLL_SECRET). Staff use /api/email/poll instead.
 */
export async function POST(req: NextRequest) {
  const secret =
    req.headers.get('x-poll-secret') ??
    new URL(req.url).searchParams.get('secret');

  const cronAuth = req.headers.get('authorization');
  const isCronValid = cronAuth && process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`;
  const isSecretValid = !!process.env.IMAP_POLL_SECRET && secret === process.env.IMAP_POLL_SECRET;

  if (!isCronValid && !isSecretValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Scheduled calls always run; a short floor still guards against overlap
  const result = await pollInbox({ minIntervalMs: 30_000 });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
