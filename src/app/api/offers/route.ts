import { NextRequest, NextResponse } from 'next/server';
import { getOffers } from '@/modules/offers/queries';
import { createOffer } from '@/modules/offers/actions';
import type { OfferType, OfferStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await getOffers({
      type: sp.get('type') as OfferType | undefined,
      status: sp.get('status') as OfferStatus | undefined,
      customer_id: sp.get('customer_id') ?? undefined,
      search: sp.get('search') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offer = await createOffer(body);
    return NextResponse.json(offer, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
