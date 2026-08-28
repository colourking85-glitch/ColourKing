import { NextResponse } from 'next/server';
import { getDamageTypes } from '@/modules/inspectie/queries';

export async function GET() {
  try {
    const data = await getDamageTypes();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
