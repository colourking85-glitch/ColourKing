import { NextRequest, NextResponse } from 'next/server';
import { getInspection } from '@/modules/inspectie/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getInspection(params.id);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
