import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInspection } from '@/modules/inspectie/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getInspection(params.id);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: ins, error: fetchErr } = await supabase
    .from('ins_inspections')
    .select('id, status')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !ins) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
  }

  if (ins.status === 'VERGRENDELD') {
    return NextResponse.json({ error: 'Locked inspections cannot be deleted' }, { status: 400 });
  }

  const { error } = await supabase
    .from('ins_inspections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
