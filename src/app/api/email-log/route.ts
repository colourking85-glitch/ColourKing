import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';

export const dynamic = 'force-dynamic';

/** GET /api/email-log?entity_type=&entity_id=&template= — most recent outbound emails for one record. */
export async function GET(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const entityType = p.get('entity_type');
  const entityId = p.get('entity_id');
  if (!entityType || !entityId) return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });

  let q = admin
    .from('email_log')
    .select('id, to_email, from_email, subject, snippet, message_id, received_at, created_at')
    .eq('direction', 'outbound')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('received_at', { ascending: false })
    .limit(10);
  const template = p.get('template');
  if (template) q = q.like('snippet', `[${template}] sent%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
