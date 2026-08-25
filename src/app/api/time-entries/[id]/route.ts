import { NextRequest, NextResponse } from 'next/server';
import { clockOut } from '@/modules/tasks/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const entry = await clockOut(params.id, body.break_minutes, body.notes);
    return NextResponse.json(entry);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Already clocked out') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
