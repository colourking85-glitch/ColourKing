import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  const { data: review, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, responded_at, locale,
      jobs(job_number),
      customers(name),
      vehicles:jobs(vehicles(kenteken, make, model))
    `)
    .eq('review_token', params.token)
    .single();

  if (error || !review) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (review.responded_at) {
    return NextResponse.json({ error: 'Already submitted', responded: true }, { status: 410 });
  }

  const job = Array.isArray(review.jobs) ? review.jobs[0] : review.jobs;
  const vehicleRaw = (review as Record<string, unknown>).vehicles;
  const vehicleNested = Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw;
  const vehicle = vehicleNested && typeof vehicleNested === 'object' && 'vehicles' in (vehicleNested as Record<string, unknown>)
    ? (vehicleNested as Record<string, unknown>).vehicles
    : vehicleNested;
  const v = (Array.isArray(vehicle) ? vehicle[0] : vehicle) as Record<string, unknown> | null;
  const customer = Array.isArray(review.customers) ? review.customers[0] : review.customers;

  return NextResponse.json({
    locale: review.locale ?? 'nl',
    customerName: (customer as Record<string, unknown> | null)?.name ?? null,
    jobNumber: (job as Record<string, unknown> | null)?.job_number ?? null,
    vehicleInfo: v ? `${v.kenteken ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim() : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();
  const body = await req.json();
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const { data: review } = await supabase
    .from('reviews')
    .select('id, responded_at')
    .eq('review_token', params.token)
    .single();

  if (!review) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (review.responded_at) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 410 });
  }

  const { error } = await supabase
    .from('reviews')
    .update({ rating, comment, responded_at: new Date().toISOString() })
    .eq('review_token', params.token);

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
