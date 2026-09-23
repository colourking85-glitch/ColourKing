import { NextRequest, NextResponse } from 'next/server';
import { getPublishedDossier } from '@/modules/portfolio/public';
import { DOSSIER_NUMBER_RE } from '@/modules/portfolio/constants';

export async function GET(_req: NextRequest, { params }: { params: { dossier: string } }) {
  if (!DOSSIER_NUMBER_RE.test(params.dossier)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const dossier = await getPublishedDossier(params.dossier);
    if (!dossier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(dossier);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
