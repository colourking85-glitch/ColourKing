import { NextRequest, NextResponse } from 'next/server';
import { getAppointment } from '@/modules/appointments/queries';
import {
  updateAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
} from '@/modules/appointments/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await getAppointment(params.id);
    return NextResponse.json(appointment);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.action === 'confirm') {
      const appointment = await confirmAppointment(params.id);
      return NextResponse.json(appointment);
    }

    if (body.action === 'cancel') {
      const appointment = await cancelAppointment(params.id, body.cancel_reason ?? '');
      return NextResponse.json(appointment);
    }

    if (body.action === 'complete') {
      const appointment = await completeAppointment(params.id);
      return NextResponse.json(appointment);
    }

    // General update
    const appointment = await updateAppointment(params.id, body);
    return NextResponse.json(appointment);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Cannot') || msg.includes('only') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteAppointment(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
