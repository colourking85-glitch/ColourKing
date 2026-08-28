import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PhotoScore {
  lighting: 'good' | 'warning' | 'bad';
  angle: 'good' | 'warning' | 'bad';
  focus: 'good' | 'warning' | 'bad';
  distance: 'good' | 'warning' | 'bad';
  damageVisible: 'good' | 'warning' | 'bad';
  overallScore: number;
  tips: string[];
}

const RATE_LIMIT_MAX = 10;
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  if (!checkRateLimit(getClientKey(req))) {
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
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const langMap: Record<string, string> = {
      nl: 'Dutch',
      en: 'English',
      tr: 'Turkish',
    };
    const language = langMap[locale] || 'English';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `You are a vehicle damage photo quality inspector for an auto body shop. Evaluate this photo for use in a damage repair quote request.

Score each criterion as "good", "warning", or "bad":
- lighting: Is the photo well-lit? Can details be seen clearly?
- angle: Is the damaged area photographed from a useful angle?
- focus: Is the image sharp and in focus?
- distance: Is the zoom/distance appropriate to see the damage?
- damageVisible: Can vehicle damage actually be seen in this photo?

Give an overall score from 0-100.
Provide 1-3 short actionable tips in ${language} if improvements are needed. If the photo is good, return an empty tips array.

Respond ONLY with valid JSON in this exact format:
{"lighting":"good","angle":"good","focus":"good","distance":"good","damageVisible":"good","overallScore":85,"tips":[]}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic API error:', res.status, err);
      return NextResponse.json({ error: 'AI evaluation failed' }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    }

    const score: PhotoScore = JSON.parse(jsonMatch[0]);

    return NextResponse.json(score);
  } catch (e) {
    console.error('Photo check error:', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
