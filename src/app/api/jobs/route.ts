import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JobSchema } from '@/modules/jobs/schema';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const stage = req.nextUrl.searchParams.get('stage');
  const search = req.nextUrl.searchParams.get('search');

  let query = supabase
    .from('jobs')
    .select(
      'id, number, stage, assigned_to, notes, job_type, priority, payer_type, estimated_hours, target_date, created_at, updated_at, customers(id, name), vehicles(id, kenteken, make, model, colour)'
    )
    .order('created_at', { ascending: false });

  if (stage) query = query.eq('stage', stage);
  if (search) {
    query = query.or(
      `number.eq.${parseInt(search) || 0},vehicles.kenteken.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = JobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const clean = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null)
  );

  const { data, error } = await supabase
    .from('jobs')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('job_events').insert({
    job_id: data.id,
    event_type: 'stage_change',
    to_stage: 'intake',
    note: 'Opdracht aangemaakt',
  });

  return NextResponse.json(data, { status: 201 });
}
