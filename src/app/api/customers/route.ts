import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerSchema } from '@/modules/customers/schema';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const search = req.nextUrl.searchParams.get('search');

  let query = supabase
    .from('customers')
    .select('id, type, name, email, phone, city, status, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = CustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const clean = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null)
  );

  const { data, error } = await supabase
    .from('customers')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
