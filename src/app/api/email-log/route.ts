import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';

export const dynamic = 'force-dynamic';

/**
 * GET /api/email-log
 *   ?entity_type=&entity_id=[&template=]  → recent outbound mails for one record (SendEmailButton "last sent")
 *   ?direction=outbound|inbound|all&q=&type=&days=&limit=  → listing for SY25
 */
export async function GET(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const entityType = p.get('entity_type');
  const entityId = p.get('entity_id');
  const direction = p.get('direction') ?? 'outbound';
  const limit = Math.min(Number(p.get('limit') ?? (entityId ? 10 : 200)), 500);

  let q = admin
    .from('email_log')
    .select('id, direction, entity_type, entity_id, to_email, from_email, subject, snippet, message_id, received_at, created_at, sent_by')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (direction !== 'all') q = q.eq('direction', direction);
  if (entityType) q = q.eq('entity_type', entityType);
  if (entityId) q = q.eq('entity_id', entityId);
  const template = p.get('template');
  if (template) q = q.like('snippet', `[${template}] sent%`);
  const type = p.get('type');
  if (type) q = q.eq('entity_type', type);
  const search = p.get('q')?.trim();
  if (search) q = q.or(`subject.ilike.%${search}%,to_email.ilike.%${search}%,from_email.ilike.%${search}%`);
  const days = Number(p.get('days'));
  if (days > 0) q = q.gte('received_at', new Date(Date.now() - days * 86_400_000).toISOString());

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
