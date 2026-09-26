import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('name, email, phone, kvk_number, btw_id')
    .eq('id', params.id)
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const conditions: string[] = [];
  if (customer.kvk_number) conditions.push(`kvk_number.eq.${customer.kvk_number}`);
  if (customer.btw_id) conditions.push(`btw_id.eq.${customer.btw_id}`);
  if (customer.email) conditions.push(`email.eq.${customer.email}`);
  if (customer.phone) conditions.push(`phone.eq.${customer.phone}`);

  if (conditions.length === 0) {
    return NextResponse.json({ duplicates: [] });
  }

  const { data: matches, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, kvk_number, btw_id, customer_no, type, status')
    .or(conditions.join(','))
    .neq('id', params.id)
    .is('deleted_at', null)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ duplicates: matches || [] });
}
