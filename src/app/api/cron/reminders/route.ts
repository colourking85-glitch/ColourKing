import { NextRequest, NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { runReminders } from '@/modules/reminders/run';
import type { ReminderKind } from '@/modules/reminders/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const KINDS: ReminderKind[] = ['invoice_due_soon', 'invoice_overdue', 'offer_expiring', 'appointment_reminder', 'vehicle_ready'];

export async function POST(req: NextRequest) {
  const auth = await requireCronOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const params = req.nextUrl.searchParams;
  const dryRun = params.get('dry') === '1';
  const kindParam = params.get('kind');
  const kinds = kindParam && KINDS.includes(kindParam as ReminderKind) ? [kindParam as ReminderKind] : undefined;

  const report = await runReminders({ dryRun, kinds, sentBy: auth.staffId });
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
