import { NextRequest, NextResponse } from 'next/server';
import { fileVatReturn } from '@/modules/vat/actions';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vatReturn = await fileVatReturn(params.id);
    return NextResponse.json(vatReturn);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Only draft') || msg.includes('locked')
      ? 409
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
