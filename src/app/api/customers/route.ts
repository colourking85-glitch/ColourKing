import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerSchema } from '@/modules/customers/schema';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const search = req.nextUrl.searchParams.get('search');
  const type = req.nextUrl.searchParams.get('type');
  const status = req.nextUrl.searchParams.get('status');
  const credit_hold = req.nextUrl.searchParams.get('credit_hold');
  const account_manager = req.nextUrl.searchParams.get('account_manager');

  let query = supabase
    .from('customers')
    .select(`
      id, customer_no, type, name, legal_name, trade_name, email, phone, city,
      status, tags, strategic_value, account_manager_id, locale, created_at,
      customer_billing(credit_hold)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,` +
      `legal_name.ilike.%${search}%,trade_name.ilike.%${search}%,` +
      `kvk_number.ilike.%${search}%,btw_id.ilike.%${search}%,customer_no.ilike.%${search}%`
    );
  }

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (account_manager) query = query.eq('account_manager_id', account_manager);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let result = data || [];

  if (credit_hold === 'true') {
    result = result.filter((c: Record<string, unknown>) => {
      const billing = c.customer_billing as Record<string, unknown> | null;
      return billing?.credit_hold === true;
    });
  }

  return NextResponse.json(result);
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
