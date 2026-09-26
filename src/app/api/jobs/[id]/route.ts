import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JobSchema } from '@/modules/jobs/schema';
import { canTransition, type JobStage } from '@/modules/jobs/machine';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(
      '*, customers(id, name, email, phone), vehicles(id, kenteken, make, model, colour, year), staff(id, name), job_events(id, event_type, from_stage, to_stage, note, created_at), job_photos(id, phase, storage_path, caption, created_at)'
    )
    .eq('id', params.id)
    .order('created_at', { referencedTable: 'job_events', ascending: false })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await req.json();

  if (body.stage && body.from_stage) {
    const from = body.from_stage as JobStage;
    const to = body.stage as JobStage;

    if (!canTransition(from, to)) {
      return NextResponse.json(
        { error: `Kan niet van ${from} naar ${to}` },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { stage: to };
    if (to === 'closed') update.closed_at = new Date().toISOString();

    const { error: jobErr } = await supabase
      .from('jobs')
      .update(update)
      .eq('id', params.id);

    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 });

    await supabase.from('job_events').insert({
      job_id: params.id,
      event_type: 'stage_change',
      from_stage: from,
      to_stage: to,
      note: body.note ?? `${from} → ${to}`,
    });

    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single();

    return NextResponse.json(data);
  }

  const parsed = JobSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(parsed.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
