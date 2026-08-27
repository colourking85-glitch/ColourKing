import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const activeOnly = req.nextUrl.searchParams.get('active') !== 'false';
  const payerType = req.nextUrl.searchParams.get('payer_type');

  let query = supabase
    .from('labour_rates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) query = query.eq('active', true);
  if (payerType) query = query.or(`payer_type.eq.${payerType},payer_type.is.null`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('labour_rates')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
