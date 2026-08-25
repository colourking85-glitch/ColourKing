import { NextRequest, NextResponse } from 'next/server';
import { updateOfferLine, removeOfferLine } from '@/modules/offers/actions';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const body = await req.json();
    const line = await updateOfferLine(params.lineId, body);
    return NextResponse.json(line);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('draft') ? 409 : msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    await removeOfferLine(params.lineId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
