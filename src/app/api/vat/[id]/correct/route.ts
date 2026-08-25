import { NextRequest, NextResponse } from 'next/server';
import { correctVatReturn } from '@/modules/vat/actions';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const correction = await correctVatReturn(params.id);
    return NextResponse.json(correction, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Only filed') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
