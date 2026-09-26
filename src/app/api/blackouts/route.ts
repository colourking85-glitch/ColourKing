import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';
import { BlackoutSchema } from '@/modules/appointments/schema';

export const dynamic = 'force-dynamic';

/** GET /api/blackouts?from&to — staff; without a range returns everything from 90 days ago onwards. */
export async function GET(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const from = p.get('from') ?? new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const to = p.get('to');

  let q = admin
    .from('blackouts')
    .select('id, title, kind, reason, start_date, end_date, all_day, resource_id, created_at, resources(name)')
    .gte('end_date', from)
    .order('start_date');
  if (to) q = q.lte('start_date', to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST /api/blackouts — office/admin create an off day (range). */
export async function POST(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (staff.role === 'tech') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = BlackoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid' }, { status: 400 });

  const { data, error } = await admin.from('blackouts').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
