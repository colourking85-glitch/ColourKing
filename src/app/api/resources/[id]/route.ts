import { NextRequest, NextResponse } from 'next/server';
import { updateResource } from '@/modules/appointments/actions';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const resource = await updateResource(params.id, body);
    return NextResponse.json(resource);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { error } = await supabase
      .from('resources')
      .update({ active: false })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
