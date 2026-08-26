import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  const { createClient: create } = require('@supabase/supabase-js'); // dynamic require to avoid bundling service key
  return create(supabaseUrl, serviceKey);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Not available' }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: caller } = await admin
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  const { data: target } = await admin
    .from('staff')
    .select('email')
    .eq('id', params.id)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
  }

  const { error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: target.email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
