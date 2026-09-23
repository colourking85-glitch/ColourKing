import { NextResponse } from 'next/server';
import { listPublishedDossiers } from '@/modules/portfolio/public';

export const revalidate = 300;

/** Published project dossiers for the public gallery. */
export async function GET() {
  try {
    return NextResponse.json(await listPublishedDossiers());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
