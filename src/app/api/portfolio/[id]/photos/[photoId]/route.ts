import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { PortfolioPhotoMeta } from '@/modules/portfolio/schema';
import { updatePhoto, deletePhoto } from '@/modules/portfolio/server';

type Ctx = { params: { id: string; photoId: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const parsed = PortfolioPhotoMeta.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    await updatePhoto(createClient(), params.id, params.photoId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  try {
    await deletePhoto(createClient(), params.id, params.photoId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
