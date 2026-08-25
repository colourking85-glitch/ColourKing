import { NextRequest, NextResponse } from 'next/server';
import { generateTasksFromOffer } from '@/modules/tasks/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_id, offer_id } = body;

    if (!job_id || !offer_id) {
      return NextResponse.json(
        { error: 'job_id and offer_id are required' },
        { status: 400 }
      );
    }

    const tasks = await generateTasksFromOffer(job_id, offer_id);
    return NextResponse.json(tasks, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
