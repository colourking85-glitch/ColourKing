import { NextRequest, NextResponse } from 'next/server';
import { getClosures } from '@/lib/closures';

export const dynamic = 'force-dynamic';

/** Public: company-wide closures in a window (default today → +60 days). Titles only, no notes. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(p.get('from') ?? '') ? p.get('from')! : today;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(p.get('to') ?? '') ? p.get('to')! : new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);

  const rows = await getClosures(from, to);
  return NextResponse.json(
    rows.map((c) => ({ title: c.title, kind: c.kind, start_date: c.start_date, end_date: c.end_date })),
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
