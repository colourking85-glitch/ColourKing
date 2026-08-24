import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleSchema } from '@/modules/vehicles/schema';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const search = req.nextUrl.searchParams.get('search');
  const customerId = req.nextUrl.searchParams.get('customer_id');

  let query = supabase
    .from('vehicles')
    .select('id, kenteken, make, model, colour, year, wok, customer_id, customers(id, name), created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (customerId) query = query.eq('customer_id', customerId);
  if (search) {
    query = query.or(`kenteken.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = VehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const clean = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null)
  );

  const { data, error } = await supabase
    .from('vehicles')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
