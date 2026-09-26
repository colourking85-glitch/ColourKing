import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';
import { sendVehicleReady } from '@/modules/email/triggers';

/** GET: whether the "car ready" email was already sent for this job. POST: send it now (staff-confirmed). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await admin
    .from('reminder_log')
    .select('id, status, recipient, created_at')
    .eq('kind', 'vehicle_ready')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ sent: data?.status === 'sent', last: data ?? null });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffUser();
  if (!staff || staff.role === 'tech') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: job } = await admin.from('jobs').select('stage').eq('id', params.id).single();
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['ready', 'delivered'].includes(job.stage)) {
    return NextResponse.json({ error: 'Job is not ready' }, { status: 409 });
  }

  const result = await sendVehicleReady(params.id);

  // Manual sends get a unique stage so the daily cron never double-sends and repeats are possible
  const { count } = await admin
    .from('reminder_log')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'vehicle_ready')
    .eq('entity_id', params.id);

  await admin.from('reminder_log').insert({
    kind: 'vehicle_ready',
    entity_type: 'job',
    entity_id: params.id,
    stage: count ? `ready-resend-${count}` : 'ready',
    recipient: result.to ?? '',
    locale: result.locale ?? 'nl',
    status: result.success ? 'sent' : result.error === 'no_email' ? 'skipped' : 'failed',
    message_id: result.messageId ?? null,
    error: result.error ?? null,
    sent_by: staff.id,
  });

  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.error === 'no_email' ? 422 : 502 });
  return NextResponse.json({ ok: true, to: result.to });
}
