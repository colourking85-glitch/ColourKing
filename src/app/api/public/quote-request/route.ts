import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase/admin';

const QuoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  kenteken: z.string().optional(),
  damage: z.string().optional(),
  locale: z.enum(['nl', 'en', 'tr']).optional().default('nl'),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.number().int().min(1900).max(2100).optional(),
  vehicle_colour: z.string().optional(),
  vehicle_vin: z.string().max(17).optional(),
  paint_code: z.string().optional(),
  is_foreign_plate: z.boolean().optional().default(false),
  service_types: z.array(z.string()).optional().default([]),
  repair_locations: z.array(z.string()).optional().default([]),
  rdw_snapshot: z.record(z.unknown()).optional(),
});

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
  };
}

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const clientKey = getClientKey(req);
    const rateLimit = checkRateLimit(clientKey);
    const headers = rateLimitHeaders(rateLimit.remaining, rateLimit.resetAt);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers });
    }

    const parsed = QuoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400, headers }
      );
    }

    const d = parsed.data;

    const { data, error } = await admin
      .from('leads')
      .insert({
        contact_name: d.name,
        contact_email: d.email ?? null,
        contact_phone: d.phone ?? null,
        kenteken: d.kenteken ?? null,
        damage_description: d.damage ?? null,
        locale: d.locale,
        origin: 'Offerte-Web',
        channel: 'quote_form',
        status: 'new',
        vehicle_make: d.vehicle_make ?? null,
        vehicle_model: d.vehicle_model ?? null,
        vehicle_year: d.vehicle_year ?? null,
        vehicle_colour: d.vehicle_colour ?? null,
        vehicle_vin: d.vehicle_vin ?? null,
        paint_code: d.paint_code ?? null,
        is_foreign_plate: d.is_foreign_plate,
        service_types: d.service_types,
        repair_locations: d.repair_locations,
        rdw_snapshot: d.rdw_snapshot ?? null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500, headers });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
