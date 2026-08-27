import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase/admin';

const PublicAppointmentSchema = z.object({
  type: z.enum(['inspection', 'drop_off', 'collection']),
  contact_name: z.string().min(1, 'Name is required'),
  contact_email: z.string().email('Invalid email').optional(),
  contact_phone: z.string().optional(),
  kenteken: z.string().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.enum(['shop', 'other']).optional().default('shop'),
  location_address: z.string().optional(),
  notes: z.string().optional(),
  locale: z.enum(['nl', 'en', 'tr']).optional().default('nl'),
});

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(getClientKey(req))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = PublicAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { type, contact_name, contact_email, contact_phone, kenteken, scheduled_date, scheduled_time, location, location_address, notes, locale } = parsed.data;

    const { data, error } = await admin
      .from('leads')
      .insert({
        contact_name,
        contact_email: contact_email ?? null,
        contact_phone: contact_phone ?? null,
        kenteken: kenteken ?? null,
        origin: 'website',
        channel: 'appointment_form',
        status: 'new',
        locale,
        appointment_type: type,
        scheduled_date,
        scheduled_time,
        location: location ?? 'shop',
        location_address: location_address ?? null,
        notes: notes ?? null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to submit appointment request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
