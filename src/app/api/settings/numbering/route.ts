import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Mock data for dev mode
    const currentYear = new Date().getFullYear();
    return NextResponse.json([
      { id: '1', doc_type: 'offer', year: currentYear, prefix: 'OFF', next_number: 1 },
      { id: '2', doc_type: 'invoice', year: currentYear, prefix: 'INV', next_number: 1 },
      { id: '3', doc_type: 'credit_note', year: currentYear, prefix: 'CN', next_number: 1 },
      { id: '4', doc_type: 'repair_order', year: currentYear, prefix: 'RO', next_number: 1 },
      { id: '5', doc_type: 'handover_note', year: currentYear, prefix: 'HO', next_number: 1 },
    ]);
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('number_ranges')
    .select('*')
    .order('doc_type');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Not available in dev mode' }, { status: 400 });
  }

  const supabase = createClient();

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!staff || staff.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { id, prefix } = body as { id: string; prefix: string };

  if (!id || !prefix) {
    return NextResponse.json(
      { error: 'id and prefix are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('number_ranges')
    .update({ prefix })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
