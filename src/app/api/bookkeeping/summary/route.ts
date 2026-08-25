import { NextRequest, NextResponse } from 'next/server';
import { getProfitLoss } from '@/modules/bookkeeping/queries';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const startDate = sp.get('startDate') ?? sp.get('start_date');
  const endDate = sp.get('endDate') ?? sp.get('end_date');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    const data = await getProfitLoss(startDate, endDate);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
