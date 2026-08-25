import { NextRequest, NextResponse } from 'next/server';
import { getResources } from '@/modules/appointments/queries';
import { createResource } from '@/modules/appointments/actions';

export async function GET() {
  try {
    const data = await getResources();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resource = await createResource(body);
    return NextResponse.json(resource, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
