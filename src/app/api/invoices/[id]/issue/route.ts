import { NextRequest, NextResponse } from 'next/server';
import { issueInvoice } from '@/modules/invoices/actions';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await issueInvoice(params.id);
    return NextResponse.json(invoice);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Cannot transition') || msg.includes('must have')
      ? 409
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
