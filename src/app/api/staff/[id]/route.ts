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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Not available' }, { status: 500 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.role !== undefined) {
    if (!['admin', 'office', 'tech'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (body.active !== undefined) {
    updates.active = Boolean(body.active);
  }

  if (body.name !== undefined) {
    updates.name = body.name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('staff')
    .update(updates)
    .eq('id', params.id)
    .select('id, email, name, role, active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.user.id === params.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Not available' }, { status: 500 });
  }

  const { error: staffError } = await admin
    .from('staff')
    .delete()
    .eq('id', params.id);

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  const { error: authError } = await admin.auth.admin.deleteUser(params.id);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
