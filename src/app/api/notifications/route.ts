import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const row: Record<string, unknown> = {
    type: body.type,
    title: body.title,
    body: body.body ?? null,
    link: body.link ?? null,
    ref_type: body.ref_type ?? null,
    ref_id: body.ref_id ?? null,
    staff_id: body.staff_id ?? null,
  };

  const clean = Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from('notifications')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  if (body.action === 'mark_all_read') {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: body.read ?? true })
      .eq('id', body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
