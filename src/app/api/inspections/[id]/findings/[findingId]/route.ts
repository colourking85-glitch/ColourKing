import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorMessage } from '@/modules/inspectie/errors';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; findingId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { error } = await supabase
      .from('ins_findings')
      .delete()
      .eq('id', params.findingId)
      .eq('inspection_id', params.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = errorMessage(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
