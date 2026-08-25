import { NextRequest, NextResponse } from 'next/server';
import { getVatReturn } from '@/modules/vat/queries';
import { createOrUpdateVatReturn } from '@/modules/vat/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vatReturn = await getVatReturn(params.id);
    return NextResponse.json(vatReturn);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the existing return to merge with updates
    const existing = await getVatReturn(params.id);
    const body = await req.json();
    const merged = { ...existing, ...body };
    const vatReturn = await createOrUpdateVatReturn(merged);
    return NextResponse.json(vatReturn);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('locked') ? 409
      : msg.includes('parse') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
