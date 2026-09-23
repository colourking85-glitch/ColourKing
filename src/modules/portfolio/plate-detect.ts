/**
 * Licence plate detection for portfolio photos (server only).
 *
 * Returns *suggested* boxes as fractions of the image (0–1). Vision-model
 * coordinates are approximate, so boxes are padded and staff always review
 * and confirm them in the redaction editor before anything is published.
 * Raw fetch matches the existing AI provider code (src/lib/ai/providers.ts).
 */

import type { RedactionRegion } from './schema';

const MODEL = 'claude-opus-5';
const PAD = 0.15; // grow each box by 15% of its size on every side

const PROMPT = `Find every vehicle licence plate (number plate) visible in this photo, including partially visible, angled, blurry or distant plates and plates on other vehicles. Also include any readable VIN sticker or VIN plate.

Return each as a bounding box in fractions of the image size: x and y are the top-left corner, w and h are width and height, all between 0 and 1 (x = 0 is the left edge, y = 0 is the top edge). Make the box cover the whole plate including its frame. If there is none, return an empty list.`;

const SCHEMA = {
  type: 'object',
  properties: {
    plates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          w: { type: 'number' },
          h: { type: 'number' },
        },
        required: ['x', 'y', 'w', 'h'],
        additionalProperties: false,
      },
    },
  },
  required: ['plates'],
  additionalProperties: false,
};

export function isPlateDetectionConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Pad a box and keep it inside the image. */
export function padRegion(r: { x: number; y: number; w: number; h: number }, pad = PAD): RedactionRegion {
  const x = clamp(r.x - r.w * pad);
  const y = clamp(r.y - r.h * pad);
  const x2 = clamp(r.x + r.w * (1 + pad));
  const y2 = clamp(r.y + r.h * (1 + pad));
  return { x, y, w: x2 - x, h: y2 - y, source: 'ai' };
}

export type DetectResult =
  | { ok: true; regions: RedactionRegion[] }
  | { ok: false; error: string };

export async function detectPlates(base64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<DetectResult> {
  if (!isPlateDetectionConfigured()) return { ok: false, error: 'not_configured' };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });

  if (!res.ok) return { ok: false, error: `api_${res.status}` };
  const data = await res.json();
  if (data.stop_reason === 'refusal') return { ok: false, error: 'refusal' };

  const text: string | undefined = data.content?.find((b: { type: string }) => b.type === 'text')?.text;
  if (!text) return { ok: false, error: 'empty' };

  try {
    const parsed = JSON.parse(text) as { plates: { x: number; y: number; w: number; h: number }[] };
    const regions = (parsed.plates ?? [])
      .filter(p => [p.x, p.y, p.w, p.h].every(n => Number.isFinite(n)) && p.w > 0 && p.h > 0)
      .map(p => padRegion(p));
    return { ok: true, regions };
  } catch {
    return { ok: false, error: 'parse' };
  }
}
