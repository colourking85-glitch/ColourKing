import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/modules/appointments/queries';
import type { AppointmentType } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get('date');
  const type = sp.get('type') as AppointmentType | null;

  if (!date || !type) {
    return NextResponse.json(
      { error: 'date and type are required' },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(date, type);
    return NextResponse.json(slots);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
