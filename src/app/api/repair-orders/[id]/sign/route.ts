import { NextRequest, NextResponse } from 'next/server';
import { addSignature } from '@/modules/repair-orders/actions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (!body.signer_name || !body.signature_data) {
      return NextResponse.json(
        { error: 'signer_name and signature_data are required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;

    const sig = await addSignature(
      params.id,
      body.signer_name,
      body.signer_role ?? 'customer',
      body.signature_data,
      ip
    );

    return NextResponse.json(sig, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('cancelled') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
