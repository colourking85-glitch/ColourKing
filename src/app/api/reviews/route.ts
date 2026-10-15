import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const status = req.nextUrl.searchParams.get('status') ?? 'all';

  let query = admin
    .from('reviews')
    .select('id, rating, comment, review_token, locale, requested_at, responded_at, published, created_at, customers(id, name, email), jobs(id, number)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status === 'pending') query = query.is('responded_at', null);
  if (status === 'responded') query = query.not('responded_at', 'is', null);
  if (status === 'published') query = query.eq('published', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(r => {
      const customer = (Array.isArray(r.customers) ? r.customers[0] : r.customers) as Record<string, unknown> | null;
      const name = String(customer?.name ?? '').toLowerCase();
      return name.includes(q) || (r.comment ?? '').toLowerCase().includes(q);
    });
  }

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const { id, published } = await req.json();
  if (!id || typeof published !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { error } = await admin
    .from('reviews')
    .update({ published })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
