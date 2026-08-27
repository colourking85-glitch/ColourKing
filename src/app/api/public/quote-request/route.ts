import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase/admin';

/**
 * Public endpoint: submit a quote request from the marketing site.
 * No auth required. Inserts a new lead using the service-role client
 * because RLS on `leads` only allows staff to read/write.
 */

const QuoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  kenteken: z.string().optional(),
  damage: z.string().optional(),
  locale: z.enum(['nl', 'en', 'tr']).optional().default('nl'),
});

// Basic in-memory rate limiting (no external deps).
// Not durable across server restarts or multiple instances, but stops
// naive abuse without adding infrastructure.
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

    const { name, email, phone, kenteken, damage, locale } = parsed.data;

    const { data, error } = await admin
      .from('leads')
      .insert({
        contact_name: name,
        contact_email: email ?? null,
        contact_phone: phone ?? null,
        kenteken: kenteken ?? null,
        damage_description: damage ?? null,
        locale,
        origin: 'website',
        channel: 'quote_form',
        status: 'new',
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
