import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorMessage } from '@/modules/inspectie/errors';
import { FindingSchema } from '@/modules/inspectie/schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = FindingSchema.parse({ ...body, inspection_id: params.id });

    const { data: finding, error } = await supabase
      .from('ins_findings')
      .upsert({ ...data, created_by: user.id }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    // First finding moves the inspection from CONCEPT into BEZIG (in progress).
    const { data: ins } = await supabase
      .from('ins_inspections')
      .select('status')
      .eq('id', params.id)
      .single();
    if (ins?.status === 'CONCEPT') {
      await supabase.rpc('ins_transition', { p_id: params.id, p_to: 'BEZIG', p_payload: {} });
    }

    return NextResponse.json(finding, { status: 201 });
  } catch (err: unknown) {
    const message = errorMessage(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
