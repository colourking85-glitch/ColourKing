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

  const { data: staff, error } = await admin
    .from('staff')
    .select('active')
    .eq('id', userId)
    .single();

  if (error || !staff) {
    console.error('[verify-staff] lookup failed', { userId, error: error?.message, code: error?.code });
    return NextResponse.json({ exists: false, active: false, debug: { userId, error: error?.message } });
  }

  return NextResponse.json({ exists: true, active: staff.active });
}

// Temporary debug endpoint — remove after login is confirmed working
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'No service key configured' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: staff, error } = await admin
    .from('staff')
    .select('id, email, name, role, active');

  return NextResponse.json({ staff: staff ?? [], error: error?.message });
}
