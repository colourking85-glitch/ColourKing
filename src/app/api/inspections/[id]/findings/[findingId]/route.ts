import { NextRequest, NextResponse } from 'next/server';
import { deleteFinding } from '@/modules/inspectie/actions';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; findingId: string } }
) {
  try {
    await deleteFinding(params.findingId, params.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
