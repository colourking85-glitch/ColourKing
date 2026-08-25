import { NextRequest, NextResponse } from 'next/server';
import { getOffer, getOfferChain } from '@/modules/offers/queries';
import {
  updateOffer,
  deleteOffer,
  sendOffer,
  approveOffer,
  rejectOffer,
  supersedeOffer,
} from '@/modules/offers/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offer = await getOffer(params.id);
    const chain = await getOfferChain(params.id);
    return NextResponse.json({ ...offer, chain });
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

    if (body.action === 'send') {
      const offer = await sendOffer(params.id);
      return NextResponse.json(offer);
    }

    if (body.action === 'approve') {
      const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
      const offer = await approveOffer(params.id, body.approved_by_name, ip);
      return NextResponse.json(offer);
    }

    if (body.action === 'reject') {
      const offer = await rejectOffer(params.id, body.rejected_reason);
      return NextResponse.json(offer);
    }

    if (body.action === 'supersede') {
      const newOffer = await supersedeOffer(params.id);
      return NextResponse.json(newOffer, { status: 201 });
    }

    // Default: update offer fields
    const offer = await updateOffer(params.id, body);
    return NextResponse.json(offer);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Only draft') || msg.includes('Cannot transition') || msg.includes('Only sent')
      ? 409
      : msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteOffer(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
