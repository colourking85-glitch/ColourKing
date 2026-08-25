import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized', status: 401 } as const;

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!staff || staff.role !== 'admin') {
    return { error: 'Forbidden: admin only', status: 403 } as const;
  }

  return { user, staff } as const;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json([
      {
        id: 'mock-admin',
        email: 'admin@colourking.nl',
        name: 'Admin (dev)',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff')
    .select('id, email, name, role, active, created_at')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Not available in dev mode' }, { status: 400 });
  }

  const supabase = createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { email, name, role } = body as {
    email: string;
    name: string;
    role: string;
  };

  if (!email || !name || !role) {
    return NextResponse.json(
      { error: 'email, name, and role are required' },
      { status: 400 }
    );
  }

  if (!['admin', 'office', 'tech'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Use service role to invite user (requires server-side admin key)
  // For the invite to work, the service role key must be used
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminSupabase = createAdminClient(supabaseUrl, serviceKey);

  const { data: invite, error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  if (!invite.user) {
    return NextResponse.json({ error: 'Invite failed' }, { status: 500 });
  }

  // Create staff record
  const { data: staffRecord, error: staffError } = await adminSupabase
    .from('staff')
    .insert({
      id: invite.user.id,
      email,
      name,
      role,
      locale: 'nl',
      active: true,
    })
    .select()
    .single();

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  return NextResponse.json(staffRecord, { status: 201 });
}
