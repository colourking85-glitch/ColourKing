import { NextRequest, NextResponse } from 'next/server';
import { getRepairOrdersForJob } from '@/modules/repair-orders/queries';
import { createRepairOrder } from '@/modules/repair-orders/actions';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const jobId = sp.get('job_id');
  if (!jobId) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
  }
  try {
    const data = await getRepairOrdersForJob(jobId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }
    const doc = await createRepairOrder(body.job_id);
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
