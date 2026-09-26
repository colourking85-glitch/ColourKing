import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ActivitySchema } from '@/modules/customers/schema';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || '50');

  const { data, error } = await supabase
    .from('customer_activities')
    .select('*')
    .eq('customer_id', params.id)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = ActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('customer_activities')
    .insert({ ...parsed.data, customer_id: params.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
