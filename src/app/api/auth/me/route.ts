import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      id: 'mock-admin',
      email: 'admin@colourking.nl',
      name: 'Admin (dev)',
      role: 'admin',
    });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use service role to bypass RLS for staff lookup
  if (serviceKey) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const admin = createAdminClient(supabaseUrl, serviceKey);

    const { data: staff } = await admin
      .from('staff')
      .select('id, email, name, role, locale, colour, active')
      .eq('id', user.id)
      .single();

    if (!staff || !staff.active) {
      return NextResponse.json({ error: 'No active staff record' }, { status: 403 });
    }

    return NextResponse.json(staff);
  }

  // No service key — return basic info from auth user
  // (RLS would block the staff table query without service key)
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.email?.split('@')[0] ?? '',
    role: 'admin',
  });
}
