import { NextRequest, NextResponse } from 'next/server';
import { getPurchase } from '@/modules/purchases/queries';
import { updatePurchase, deletePurchase } from '@/modules/purchases/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await getPurchase(params.id);
    return NextResponse.json(purchase);
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
    const purchase = await updatePurchase(params.id, body);
    return NextResponse.json(purchase);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePurchase(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
