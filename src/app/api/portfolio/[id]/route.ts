import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { PortfolioProjectInput } from '@/modules/portfolio/schema';
import { getProject, updateProject, softDeleteProject, publishProject, setStatus } from '@/modules/portfolio/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const project = await getProject(createClient(), params.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const parsed = PortfolioProjectInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    await updateProject(createClient(), params.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Status actions: { action: 'publish' | 'unpublish' | 'archive' | 'restore' } */
export async function POST(req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const { action } = await req.json().catch(() => ({}));
  const db = createClient();
  try {
    switch (action) {
      case 'publish': {
        const result = await publishProject(db, params.id);
        return NextResponse.json(result, { status: result.ok ? 200 : 422 });
      }
      case 'unpublish':
      case 'restore':
        await setStatus(db, params.id, 'draft');
        return NextResponse.json({ ok: true });
      case 'archive':
        await setStatus(db, params.id, 'archived');
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Soft delete (row kept, hidden everywhere). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  try {
    await softDeleteProject(createClient(), params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
