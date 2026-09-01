import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getDefaultProvider, type AIProviderId } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX = 5;
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
  const { data } = await admin
    .from('settings')
    .select('value')
    .eq('key', 'ai')
    .single();

  const aiSettings = data?.value as Record<string, unknown> | null;
  const preferredProvider = (aiSettings?.damage_assess_provider ?? aiSettings?.default_provider) as AIProviderId | null;
  const provider = getDefaultProvider(preferredProvider);

  if (!provider) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  if (!checkRateLimit(`damage:${getClientKey(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const locale = (formData.get('locale') as string) || 'nl';

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'No valid image provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const langMap: Record<string, string> = { nl: 'Dutch', en: 'English', tr: 'Turkish' };
    const language = langMap[locale] || 'English';

    const assessment = await provider.assessDamage(base64, file.type, language);

    return NextResponse.json({ ...assessment, provider: provider.id });
  } catch (e) {
    console.error('Damage assess error:', e);
    return NextResponse.json({ error: 'AI assessment failed' }, { status: 502 });
  }
}
