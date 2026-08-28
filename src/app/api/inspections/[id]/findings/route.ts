import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { FindingSchema } from '@/modules/inspectie/schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const db = user ? supabase : createServiceClient();

    const body = await req.json();
    const data = FindingSchema.parse({ ...body, inspection_id: params.id });

    const { data: finding, error } = await db
      .from('ins_findings')
      .upsert({
        ...data,
        ...(user ? { created_by: user.id } : {}),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(finding, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
