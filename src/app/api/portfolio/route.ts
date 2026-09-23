import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { PortfolioProjectInput } from '@/modules/portfolio/schema';
import { listProjects, createProject } from '@/modules/portfolio/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  try {
    return NextResponse.json(await listProjects(createClient()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await requirePortfolioStaff();
  if (staff instanceof NextResponse) return staff;
  const parsed = PortfolioProjectInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const created = await createProject(createClient(), parsed.data, staff.id);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
