import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
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

  const allowed: AppointmentType[] = ['inspection', 'drop_off', 'collection'];
  if (!allowed.includes(type)) {
    return NextResponse.json(
      { error: 'Only inspection, drop_off and collection types are available for public booking' },
      { status: 400 }
    );
  }

  try {
    const d = new Date(date + 'T00:00:00');
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const { data: hours } = await admin
      .from('opening_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek);

    if (!hours || hours.length === 0) return NextResponse.json([]);

    const openTime = hours[0].open_time;
    const closeTime = hours[0].close_time;

    const { data: blackouts } = await admin
      .from('blackouts')
      .select('*')
      .lte('start_date', date)
      .gte('end_date', date);

    if (blackouts?.some(b => !b.resource_id && b.all_day)) {
      return NextResponse.json([]);
    }

    const { data: existing } = await admin
      .from('appointments')
      .select('scheduled_time, duration_minutes, resource_id')
      .eq('scheduled_date', date)
      .neq('status', 'cancelled');

    const { data: resources } = await admin
      .from('resources')
      .select('*')
      .eq('active', true);

    const defaultDuration = 30;

    const slots: { time: string; available: boolean }[] = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m + defaultDuration <= closeMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      const availableResources = (resources ?? []).filter(r => {
        if (blackouts?.some(b => b.resource_id === r.id)) return false;
        const overlaps = (existing ?? []).filter(a => {
          if (a.resource_id !== r.id) return false;
          const [aH, aM] = a.scheduled_time.split(':').map(Number);
          const aStart = aH * 60 + aM;
          const aEnd = aStart + a.duration_minutes;
          const slotEnd = m + defaultDuration;
          return m < aEnd && slotEnd > aStart;
        });
        return overlaps.length < r.capacity;
      });

      slots.push({ time: timeStr, available: availableResources.length > 0 });
    }

    return NextResponse.json(slots);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
