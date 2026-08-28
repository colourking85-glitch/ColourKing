import { NextRequest, NextResponse } from 'next/server';
import { transitionInspection } from '@/modules/inspectie/actions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { to } = await req.json();
    const inspection = await transitionInspection(params.id, to);
    return NextResponse.json(inspection);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
