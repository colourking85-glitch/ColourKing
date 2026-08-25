import { NextRequest, NextResponse } from 'next/server';
import { listInvoices } from '@/modules/invoices/queries';
import { createInvoiceFromOffer } from '@/modules/invoices/actions';
import type { InvoiceStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await listInvoices({
      status: sp.get('status') as InvoiceStatus | undefined,
      customer_id: sp.get('customer_id') ?? undefined,
      search: sp.get('search') ?? undefined,
      date_from: sp.get('date_from') ?? undefined,
      date_to: sp.get('date_to') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoice = await createInvoiceFromOffer(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400
      : msg.includes('Only approved') ? 409
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
