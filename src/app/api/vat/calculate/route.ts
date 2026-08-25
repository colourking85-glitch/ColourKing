import { NextRequest, NextResponse } from 'next/server';
import { calculateVatReturn } from '@/modules/vat/actions';
import type { VatPeriodType } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await calculateVatReturn(
      body.year,
      body.period,
      (body.period_type ?? 'quarter') as VatPeriodType
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
