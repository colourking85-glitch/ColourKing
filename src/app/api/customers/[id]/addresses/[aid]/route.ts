import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AddressSchema } from '@/modules/customers/schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; aid: string } }
) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = AddressSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(parsed.data)
    .eq('id', params.aid)
    .eq('customer_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; aid: string } }
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', params.aid)
    .eq('customer_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
