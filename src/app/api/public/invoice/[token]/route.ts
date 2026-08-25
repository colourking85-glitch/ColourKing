import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceByToken } from '@/modules/invoices/queries';

/**
 * Public endpoint: get invoice by payment token.
 * No auth required — the token serves as the access control.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invoice = await getInvoiceByToken(params.token);
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
}
