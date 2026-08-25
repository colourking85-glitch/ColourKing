import { NextRequest, NextResponse } from 'next/server';
import { listPurchases } from '@/modules/purchases/queries';
import { createPurchase } from '@/modules/purchases/actions';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await listPurchases({
      category: sp.get('category') ?? undefined,
      paid: (sp.get('paid') as 'all' | 'paid' | 'unpaid') ?? undefined,
      date_from: sp.get('date_from') ?? undefined,
      date_to: sp.get('date_to') ?? undefined,
      search: sp.get('search') ?? undefined,
      supplier: sp.get('supplier') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const purchase = await createPurchase(body);
    return NextResponse.json(purchase, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
