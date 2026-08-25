import { NextRequest, NextResponse } from 'next/server';
import { getOfferLines } from '@/modules/offers/queries';
import { addOfferLine } from '@/modules/offers/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lines = await getOfferLines(params.id);
    return NextResponse.json(lines);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const line = await addOfferLine(params.id, body);
    return NextResponse.json(line, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : msg.includes('draft') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
