import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, getInvoiceChain } from '@/modules/invoices/queries';
import { updateInvoice, deleteInvoice } from '@/modules/invoices/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await getInvoice(params.id);
    const chain = await getInvoiceChain(params.id);
    return NextResponse.json({ ...invoice, chain });
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
    const invoice = await updateInvoice(params.id, body);
    return NextResponse.json(invoice);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Only draft') ? 409
      : msg.includes('parse') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteInvoice(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
