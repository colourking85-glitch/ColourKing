'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { JobSchema } from './schema';
import { canTransition, type JobStage } from './machine';

export async function createJob(input: unknown) {
  const data = JobSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: job, error } = await supabase
    .from('jobs')
    .insert(clean)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('job_events').insert({
    job_id: job.id,
    event_type: 'stage_change',
    to_stage: 'intake',
    note: 'Opdracht aangemaakt',
  });

  revalidatePath('/app/jobs');
  return job;
}

export async function changeJobStage(
  id: string,
  from: JobStage,
  to: JobStage,
  note?: string
) {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot transition from ${from} to ${to}`);
  }

  const supabase = createClient();

  const update: Record<string, unknown> = { stage: to };
  if (to === 'closed') update.closed_at = new Date().toISOString();

  const { error: jobError } = await supabase
    .from('jobs')
    .update(update)
    .eq('id', id);

  if (jobError) throw jobError;

  const { error: eventError } = await supabase.from('job_events').insert({
    job_id: id,
    event_type: 'stage_change',
    from_stage: from,
    to_stage: to,
    note: note ?? `${from} → ${to}`,
  });

  if (eventError) throw eventError;

  revalidatePath('/app/jobs');
  revalidatePath(`/app/jobs/${id}`);
  revalidatePath('/app/jobs/board');
}

export async function updateJob(id: string, input: unknown) {
  const data = JobSchema.partial().parse(input);
  const supabase = createClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/jobs');
  revalidatePath(`/app/jobs/${id}`);
  return job;
}

export async function addJobNote(id: string, note: string) {
  const supabase = createClient();

  const { error } = await supabase.from('job_events').insert({
    job_id: id,
    event_type: 'note',
    note,
  });

  if (error) throw error;
  revalidatePath(`/app/jobs/${id}`);
}
