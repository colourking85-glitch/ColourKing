import { NextRequest, NextResponse } from 'next/server';
import { getPart } from '@/modules/parts/queries';
import { updatePart, deletePart, changePartStatus, setBlocking } from '@/modules/parts/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const part = await getPart(params.id);
    return NextResponse.json(part);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.action === 'change_status') {
      const part = await changePartStatus(params.id, body.status);
      return NextResponse.json(part);
    }

    if (body.action === 'set_blocking') {
      const part = await setBlocking(params.id, body.blocking);
      return NextResponse.json(part);
    }

    const part = await updatePart(params.id, body);
    return NextResponse.json(part);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Cannot transition') || msg.includes('Only parts') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePart(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
