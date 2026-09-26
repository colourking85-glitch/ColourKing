import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { findClosure } from '@/lib/closures';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const force = req.nextUrl.searchParams.get('force') === '1';

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!lead.appointment_type || !lead.scheduled_date || !lead.scheduled_time) {
    return NextResponse.json({ error: 'Lead has no appointment data' }, { status: 400 });
  }

  if (!force) {
    const closure = await findClosure(lead.scheduled_date);
    if (closure) {
      return NextResponse.json(
        { error: 'closed', closure: { title: closure.title, start_date: closure.start_date, end_date: closure.end_date } },
        { status: 409 },
      );
    }
  }

  const { data: appointment, error: aptErr } = await supabase
    .from('appointments')
    .insert({
      type: lead.appointment_type,
      status: 'confirmed',
      contact_name: lead.contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      scheduled_date: lead.scheduled_date,
      scheduled_time: lead.scheduled_time,
      notes: lead.notes,
      confirmed_at: new Date().toISOString(),
      customer_id: lead.customer_id ?? null,
      vehicle_id: lead.vehicle_id ?? null,
    })
    .select('id')
    .single();

  if (aptErr) {
    return NextResponse.json({ error: aptErr.message }, { status: 500 });
  }

  await supabase
    .from('leads')
    .update({ status: 'won' })
    .eq('id', params.id);

  return NextResponse.json({
    success: true,
    appointment_id: appointment.id,
    lead_status: 'won',
  });
}
