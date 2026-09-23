import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStaffUser } from '@/lib/supabase/staff';
import { requirePortfolioStaff } from '@/modules/portfolio/auth';
import { convertJobToProject, getDossierForJob } from '@/modules/portfolio/server';

type Ctx = { params: { id: string } };

/** JB10: the dossier for this work order (if any) and whether this user may convert. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const dossier = staff.role === 'tech' ? null : await getDossierForJob(createClient(), params.id);
  return NextResponse.json({ dossier, canConvert: staff.role === 'admin' });
}

/** Convert a completed work order into a project dossier (admin/manager only). */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const staff = await requirePortfolioStaff(true);
  if (staff instanceof NextResponse) return staff;
  try {
    const result = await convertJobToProject(createClient(), params.id, staff.id);
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
