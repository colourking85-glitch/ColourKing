import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingSchema } from '@/modules/customers/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customer_billing')
    .select('*')
    .eq('customer_id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = BillingSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('customer_billing')
    .select('id')
    .eq('customer_id', params.id)
    .maybeSingle();

  let data, error;
  if (existing) {
    ({ data, error } = await supabase
      .from('customer_billing')
      .update(parsed.data)
      .eq('customer_id', params.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('customer_billing')
      .insert({ ...parsed.data, customer_id: params.id })
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
