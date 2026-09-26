import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';

export const dynamic = 'force-dynamic';

/** GET /api/reminders?kind=&status=&limit= — reminder log for SY60, with entity numbers resolved. */
export async function GET(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const limit = Math.min(Number(p.get('limit') ?? 100), 500);

  let q = admin
    .from('reminder_log')
    .select('id, kind, entity_type, entity_id, stage, recipient, locale, status, message_id, error, sent_by, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (p.get('kind')) q = q.eq('kind', p.get('kind')!);
  if (p.get('status')) q = q.eq('status', p.get('status')!);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const byType = (t: string) => rows.filter((r) => r.entity_type === t).map((r) => r.entity_id);
  const labels = new Map<string, string>();

  const [inv, off, apt, job] = await Promise.all([
    byType('invoice').length ? admin.from('invoices').select('id, invoice_number').in('id', byType('invoice')) : null,
    byType('offer').length ? admin.from('offers').select('id, offer_number').in('id', byType('offer')) : null,
    byType('appointment').length ? admin.from('appointments').select('id, contact_name, scheduled_date').in('id', byType('appointment')) : null,
    byType('job').length ? admin.from('jobs').select('id, number').in('id', byType('job')) : null,
  ]);
  inv?.data?.forEach((r) => labels.set(r.id, r.invoice_number ?? r.id.slice(0, 8)));
  off?.data?.forEach((r) => labels.set(r.id, r.offer_number ?? r.id.slice(0, 8)));
  apt?.data?.forEach((r) => labels.set(r.id, `${r.contact_name ?? ''} ${r.scheduled_date}`.trim()));
  job?.data?.forEach((r) => labels.set(r.id, r.number != null ? `JB-${r.number}` : r.id.slice(0, 8)));

  const ENTITY_ROUTE: Record<string, string> = { invoice: '/app/facturen', offer: '/app/offertes', appointment: '/app/afspraken', job: '/app/jobs' };

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      entity_label: labels.get(r.entity_id) ?? r.entity_id.slice(0, 8),
      entity_href: `${ENTITY_ROUTE[r.entity_type] ?? '/app'}/${r.entity_id}`,
    })),
  );
}
