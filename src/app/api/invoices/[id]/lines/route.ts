import { NextRequest, NextResponse } from 'next/server';
import { addInvoiceLine, removeInvoiceLine } from '@/modules/invoices/actions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const line = await addInvoiceLine(id, body);
    return NextResponse.json(line, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : msg.includes('draft') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { lineId } = await req.json();
    await removeInvoiceLine(lineId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('draft') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
