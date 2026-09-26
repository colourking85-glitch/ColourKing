import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreditHoldSchema } from '@/modules/customers/schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = CreditHoldSchema.safeParse(body);
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
      .update({
        credit_hold: parsed.data.credit_hold,
        credit_hold_reason: parsed.data.reason || null,
        credit_hold_since: parsed.data.credit_hold ? new Date().toISOString() : null,
      })
      .eq('customer_id', params.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('customer_billing')
      .insert({
        customer_id: params.id,
        credit_hold: parsed.data.credit_hold,
        credit_hold_reason: parsed.data.reason || null,
        credit_hold_since: parsed.data.credit_hold ? new Date().toISOString() : null,
      })
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
