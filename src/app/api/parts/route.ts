import { NextRequest, NextResponse } from 'next/server';
import { getParts } from '@/modules/parts/queries';
import { createPart } from '@/modules/parts/actions';
import type { PartStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await getParts({
      job_id: sp.get('job_id') ?? undefined,
      status: sp.get('status') as PartStatus | undefined,
      blocking: sp.has('blocking') ? sp.get('blocking') === 'true' : undefined,
      search: sp.get('search') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const part = await createPart(body);
    return NextResponse.json(part, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
