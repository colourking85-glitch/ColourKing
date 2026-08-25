import { NextRequest, NextResponse } from 'next/server';
import { createCreditNote } from '@/modules/invoices/actions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const creditNote = await createCreditNote({
      invoice_id: params.id,
      reason: body.reason,
    });
    return NextResponse.json(creditNote, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Can only create') ? 409
      : msg.includes('parse') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
