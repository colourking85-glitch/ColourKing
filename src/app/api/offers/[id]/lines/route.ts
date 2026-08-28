import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getOfferLines } from '@/modules/offers/queries';
import { OfferLineSchema } from '@/modules/offers/schema';

const TAX_RATES: Record<string, number> = {
  H21: 0.21, L9: 0.09, N0: 0, V0: 0, M0: 0, ICP: 0, EX: 0,
};

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
    const parsed = OfferLineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const db = user ? supabase : createServiceClient();

    // Check offer is draft
    const { data: offer, error: fetchErr } = await db
      .from('offers')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (offer.status !== 'draft') {
      return NextResponse.json({ error: 'Can only add lines to draft offers' }, { status: 409 });
    }

    const data = parsed.data;
    const grossCents = Math.round(data.quantity * data.unit_price_cents);
    const discountCents = Math.round(grossCents * data.discount_pct / 100);
    const line_total_cents = grossCents - discountCents;
    const vatRate = TAX_RATES[data.tax_code] ?? 0;
    const vat_amount_cents = Math.round(line_total_cents * vatRate);

    const { data: line, error } = await db
      .from('offer_lines')
      .insert({
        offer_id: params.id,
        ...data,
        line_total_cents,
        vat_amount_cents,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recalculate offer totals
    const { data: allLines } = await db
      .from('offer_lines')
      .select('line_total_cents, vat_amount_cents')
      .eq('offer_id', params.id);

    const subtotal_cents = (allLines ?? []).reduce((s, l) => s + l.line_total_cents, 0);
    const vat_cents = (allLines ?? []).reduce((s, l) => s + l.vat_amount_cents, 0);
    await db
      .from('offers')
      .update({ subtotal_cents, vat_cents, total_cents: subtotal_cents + vat_cents })
      .eq('id', params.id);

    return NextResponse.json(line, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
