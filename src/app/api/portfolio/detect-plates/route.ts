import { NextRequest, NextResponse } from 'next/server';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { detectPlates, isPlateDetectionConfigured } from '@/modules/portfolio/plate-detect';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BASE64 = 4_000_000; // ~3 MB image; the editor sends a 1280px JPEG

/** GET: is AI plate detection available? POST { image: base64 jpeg } → suggested boxes. */
export async function GET() {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  return NextResponse.json({ available: isPlateDetectionConfigured() });
}

export async function POST(req: NextRequest) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const { image } = await req.json().catch(() => ({}));
  if (typeof image !== 'string' || !image || image.length > MAX_BASE64) {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  }
  const result = await detectPlates(image, 'image/jpeg');
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
