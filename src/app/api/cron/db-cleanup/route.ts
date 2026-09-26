import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireCronOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const cutoffISO = cutoff.toISOString();

  const results: Record<string, number> = {};

  const { count: pvCount } = await supabase
    .from('site_pageviews')
    .delete({ count: 'exact' })
    .lt('viewed_at', cutoffISO);
  results.pageviews_deleted = pvCount ?? 0;

  const { count: sessCount } = await supabase
    .from('site_sessions')
    .delete({ count: 'exact' })
    .lt('started_at', cutoffISO);
  results.sessions_deleted = sessCount ?? 0;

  return NextResponse.json({ ok: true, cutoff: cutoffISO, ...results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
