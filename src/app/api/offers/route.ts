import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getOffers } from '@/modules/offers/queries';
import { OfferSchema } from '@/modules/offers/schema';
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
    const parsed = OfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use authenticated client, or fall back to service client in dev
    const db = user ? supabase : createServiceClient();

    const clean = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v != null)
    );

    const { data: offer, error } = await db
      .from('offers')
      .insert({ ...clean, status: 'draft', ...(user ? { created_by: user.id } : {}) })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(offer, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
