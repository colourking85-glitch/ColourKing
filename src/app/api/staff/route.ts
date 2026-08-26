import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  const { createClient: create } = require('@supabase/supabase-js'); // dynamic require to avoid bundling service key
  return create(supabaseUrl, serviceKey);
}

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized', status: 401 } as const;

  const admin = getAdminClient();
  if (!admin) return { error: 'Service key not configured', status: 500 } as const;

  const { data: staff } = await admin
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

  const admin = getAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from('staff')
      .select('id, email, name, role, active, created_at')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Fallback: try with anon key
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

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { email, name, password, role } = body as {
    email: string;
    name: string;
    password?: string;
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

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  // Create auth user with password or invite
  let userId: string;

  if (password && password.length >= 8) {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    userId = created.user.id;
  } else {
    const { data: invite, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    if (!invite.user) {
      return NextResponse.json({ error: 'Invite failed' }, { status: 500 });
    }
    userId = invite.user.id;
  }

  // Create staff record
  const { data: staffRecord, error: staffError } = await admin
    .from('staff')
    .insert({
      id: userId,
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
