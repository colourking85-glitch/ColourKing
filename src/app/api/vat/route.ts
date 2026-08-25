import { NextRequest, NextResponse } from 'next/server';
import { listVatReturns } from '@/modules/vat/queries';
import { createOrUpdateVatReturn } from '@/modules/vat/actions';
import type { VatReturnStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await listVatReturns({
      year: sp.get('year') ? Number(sp.get('year')) : undefined,
      status: (sp.get('status') as VatReturnStatus) ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vatReturn = await createOrUpdateVatReturn(body);
    return NextResponse.json(vatReturn, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('locked') ? 409
      : msg.includes('parse') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
