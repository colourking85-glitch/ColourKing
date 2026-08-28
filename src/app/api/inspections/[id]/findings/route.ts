import { NextRequest, NextResponse } from 'next/server';
import { upsertFinding } from '@/modules/inspectie/actions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const finding = await upsertFinding({ ...body, inspection_id: params.id });
    return NextResponse.json(finding, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
