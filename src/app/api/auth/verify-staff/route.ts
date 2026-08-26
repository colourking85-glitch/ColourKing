import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ exists: true, active: true });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: staff } = await admin
    .from('staff')
    .select('active')
    .eq('id', userId)
    .single();

  if (!staff) {
    return NextResponse.json({ exists: false, active: false });
  }

  return NextResponse.json({ exists: true, active: staff.active });
}
