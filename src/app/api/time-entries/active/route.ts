import { NextRequest, NextResponse } from 'next/server';
import { getActiveTimeEntry } from '@/modules/tasks/queries';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const staffId = sp.get('staff_id');

  if (!staffId) {
    return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
  }

  try {
    const entry = await getActiveTimeEntry(staffId);
    return NextResponse.json(entry);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
