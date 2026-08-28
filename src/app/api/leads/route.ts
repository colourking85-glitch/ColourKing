import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LeadSchema } from '@/modules/leads/schema';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const search = req.nextUrl.searchParams.get('search');
  const status = req.nextUrl.searchParams.get('status');
  const origin = req.nextUrl.searchParams.get('origin');
  const sortBy = req.nextUrl.searchParams.get('sort') ?? 'created_at';
  const sortDir = req.nextUrl.searchParams.get('dir') === 'asc' ? true : false;

  const allowedSorts = ['created_at', 'contact_name', 'status', 'origin'];
  const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'created_at';

  let query = supabase
    .from('leads')
    .select('id, contact_name, contact_email, contact_phone, kenteken, damage_description, status, origin, preferred_date, channel, appointment_type, locale, created_at, customers(id, name), vehicles(id, kenteken, make, model)')
    .order(sortColumn, { ascending: sortDir });

  if (status) query = query.eq('status', status);
  if (origin) query = query.eq('origin', origin);
  if (search) {
    query = query.or(`contact_name.ilike.%${search}%,contact_email.ilike.%${search}%,kenteken.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const clean = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null)
  );

  const { data, error } = await supabase
    .from('leads')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
