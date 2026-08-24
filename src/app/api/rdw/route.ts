import { NextRequest, NextResponse } from 'next/server';
import { lookupKenteken, rdwToVehicleFields } from '@/lib/rdw';

export async function GET(req: NextRequest) {
  const kenteken = req.nextUrl.searchParams.get('kenteken');
  if (!kenteken) {
    return NextResponse.json({ error: 'kenteken parameter required' }, { status: 400 });
  }

  const rdw = await lookupKenteken(kenteken);
  if (!rdw) {
    return NextResponse.json({ error: 'Kenteken niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(rdwToVehicleFields(rdw));
}
