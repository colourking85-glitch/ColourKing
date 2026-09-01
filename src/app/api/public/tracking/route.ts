import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STAGE_ORDER = [
  'intake', 'quoted', 'approved', 'scheduled',
  'checked_in', 'in_progress', 'qc', 'ready', 'delivered', 'closed',
] as const;

const CUSTOMER_STAGES = [
  { key: 'received', internal: ['intake', 'quoted', 'approved'] },
  { key: 'scheduled', internal: ['scheduled', 'checked_in'] },
  { key: 'repairing', internal: ['in_progress'] },
  { key: 'quality_check', internal: ['qc'] },
  { key: 'ready', internal: ['ready'] },
  { key: 'completed', internal: ['delivered', 'closed'] },
] as const;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

function mapToCustomerStage(internalStage: string) {
  for (const cs of CUSTOMER_STAGES) {
    if ((cs.internal as readonly string[]).includes(internalStage)) return cs.key;
  }
  return 'received';
}

function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();

  if (!code || code.length < 6 || code.length > 12) {
    return NextResponse.json({ error: 'Invalid tracking code' }, { status: 400 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json({
      tracking_code: code,
      current_stage: 'repairing',
      stages: CUSTOMER_STAGES.map((s, i) => ({
        key: s.key,
        status: i <= 2 ? 'completed' : i === 2 ? 'active' : 'pending',
        timestamp: i <= 2 ? new Date(Date.now() - (3 - i) * 86400000).toISOString() : null,
      })),
      vehicle: { make: 'Demo', model: 'Auto' },
      job_number: 1001,
    });
  }

  const { data: job, error } = await client
    .from('jobs')
    .select(`
      id, number, stage, tracking_enabled, created_at, updated_at,
      vehicles!inner(make, model, colour),
      job_events(event_type, from_stage, to_stage, created_at)
    `)
    .eq('tracking_code', code)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!job.tracking_enabled) {
    return NextResponse.json({ error: 'tracking_disabled' }, { status: 403 });
  }

  const currentStageIndex = getStageIndex(job.stage);
  const stageTimestamps: Record<string, string> = {};
  stageTimestamps[job.stage] = job.updated_at;

  const events = (job.job_events || [])
    .filter((e: { event_type: string }) => e.event_type === 'stage_change')
    .sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  for (const evt of events) {
    if (evt.to_stage) {
      stageTimestamps[evt.to_stage] = evt.created_at;
    }
  }

  const stages = CUSTOMER_STAGES.map((cs) => {
    const highestInternalIndex = Math.max(
      ...cs.internal.map((s) => getStageIndex(s))
    );
    const lowestInternalIndex = Math.min(
      ...cs.internal.map((s) => getStageIndex(s))
    );

    let status: 'completed' | 'active' | 'pending';
    if (currentStageIndex > highestInternalIndex) {
      status = 'completed';
    } else if (currentStageIndex >= lowestInternalIndex && currentStageIndex <= highestInternalIndex) {
      status = 'active';
    } else {
      status = 'pending';
    }

    const timestamp = cs.internal
      .map((s) => stageTimestamps[s])
      .filter(Boolean)
      .sort()
      .pop() || null;

    return { key: cs.key, status, timestamp };
  });

  const vehicle = job.vehicles;

  return NextResponse.json({
    tracking_code: code,
    current_stage: mapToCustomerStage(job.stage),
    stages,
    vehicle: vehicle ? {
      make: vehicle.make,
      model: vehicle.model,
      colour: vehicle.colour,
    } : null,
    job_number: job.number,
  });
}
