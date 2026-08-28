import { NextRequest, NextResponse } from 'next/server';
import { getInspections } from '@/modules/inspectie/queries';
import { createInspection } from '@/modules/inspectie/actions';
import type { InsStatus } from '@/modules/inspectie/machine';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as InsStatus | null;
  const search = req.nextUrl.searchParams.get('search');
  const vehicle_id = req.nextUrl.searchParams.get('vehicle_id');
  const customer_id = req.nextUrl.searchParams.get('customer_id');

  try {
    const data = await getInspections({
      status: status || undefined,
      search: search || undefined,
      vehicle_id: vehicle_id || undefined,
      customer_id: customer_id || undefined,
    });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inspection = await createInspection(body);
    return NextResponse.json(inspection, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
