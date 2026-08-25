import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntries } from '@/modules/tasks/queries';
import { clockIn } from '@/modules/tasks/actions';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await getTimeEntries({
      staff_id: sp.get('staff_id') ?? undefined,
      job_id: sp.get('job_id') ?? undefined,
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = await clockIn(body.staff_id, body.job_id, body.task_id);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Already clocked in') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
