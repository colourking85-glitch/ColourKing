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

  // Attach lead details to notifications that point at a lead. Email log
  // rows store ref_type='email' but keep the lead id in ref_id, so match
  // any ref_id against leads (UUIDs don't collide across tables).
  const refIds = Array.from(new Set((data ?? []).map(n => n.ref_id).filter((id): id is string => !!id)));
  const leadsById = new Map<string, NotificationLead>();
  if (refIds.length > 0) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, number, created_at, damage_description, appointment_type, channel, service_types')
      .in('id', refIds);
    for (const l of leads ?? []) {
      leadsById.set(l.id, {
        id: l.id,
        number: l.number,
        created_at: l.created_at,
        subject: leadSubject(l),
        appointment_type: l.channel === 'appointment_form' ? (l.appointment_type ?? 'inspection') : null,
      });
    }
  }

  return NextResponse.json(
    (data ?? []).map(n => ({ ...n, lead: (n.ref_id && leadsById.get(n.ref_id)) || null })),
  );
}

type NotificationLead = {
  id: string;
  number: number | null;
  created_at: string;
  subject: string | null;
  appointment_type: string | null;
};

/** Contact-form leads store "[Subject] message"; otherwise use the first line of the description. */
function leadSubject(l: { damage_description: string | null; service_types: string[] | null }): string | null {
  const desc = l.damage_description?.trim();
  if (desc) {
    const m = desc.match(/^\[([^\]]+)\]/);
    const text = m ? m[1] : desc.split('\n')[0];
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  }
  return l.service_types?.length ? l.service_types.join(', ') : null;
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
