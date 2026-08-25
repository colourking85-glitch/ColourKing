import { NextRequest, NextResponse } from 'next/server';
import { getAppointments } from '@/modules/appointments/queries';
import { createAppointment } from '@/modules/appointments/actions';
import type { AppointmentType, AppointmentStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await getAppointments({
      type: sp.get('type') as AppointmentType | undefined,
      status: sp.get('status') as AppointmentStatus | undefined,
      customer_id: sp.get('customer_id') ?? undefined,
      date_from: sp.get('date_from') ?? undefined,
      date_to: sp.get('date_to') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointment = await createAppointment(body);
    return NextResponse.json(appointment, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
