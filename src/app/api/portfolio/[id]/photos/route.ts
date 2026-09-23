import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { PortfolioPhotoMeta, RedactionRegion } from '@/modules/portfolio/schema';
import { addPhoto } from '@/modules/portfolio/server';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/webp'] as const;

/**
 * Upload one photo that was redacted in the browser (PF10 editor).
 * form-data: file, meta (JSON: phase, pair_group, is_cover, alt_*),
 * regions (JSON array), width, height, confirmed ('true'), source_job_photo_id?
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 });
  if (!TYPES.includes(file.type as (typeof TYPES)[number])) {
    return NextResponse.json({ error: 'Only redacted JPEG/WebP from the editor is accepted' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 });

  // The staff member must confirm no readable plate remains
  if (form.get('confirmed') !== 'true') {
    return NextResponse.json({ error: 'Redaction must be confirmed' }, { status: 400 });
  }

  let meta: z.infer<typeof PortfolioPhotoMeta>;
  let regions: z.infer<typeof RedactionRegion>[];
  try {
    meta = PortfolioPhotoMeta.parse(JSON.parse(String(form.get('meta') ?? '{}')));
    regions = z.array(RedactionRegion).max(50).parse(JSON.parse(String(form.get('regions') ?? '[]')));
  } catch {
    return NextResponse.json({ error: 'Invalid photo metadata' }, { status: 400 });
  }

  const width = Number(form.get('width')) || null;
  const height = Number(form.get('height')) || null;
  const sourceJobPhotoId = form.get('source_job_photo_id');

  try {
    const photo = await addPhoto(
      createClient(),
      params.id,
      { bytes: await file.arrayBuffer(), type: file.type as (typeof TYPES)[number], width: width ?? 0, height: height ?? 0 },
      { ...meta, regions, sourceJobPhotoId: typeof sourceJobPhotoId === 'string' && sourceJobPhotoId ? sourceJobPhotoId : null },
      staff.id,
    );
    return NextResponse.json(photo, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
