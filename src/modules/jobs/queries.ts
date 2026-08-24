import { createClient } from '@/lib/supabase/server';

export async function getJobs(stage?: string, search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('jobs')
    .select(
      'id, number, stage, assigned_to, intake_km, notes, created_at, updated_at, customers(id, name), vehicles(id, kenteken, make, model, colour), staff(id, name)'
    )
    .order('created_at', { ascending: false });

  if (stage) query = query.eq('stage', stage);
  if (search) {
    query = query.or(
      `customers.name.ilike.%${search}%,vehicles.kenteken.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getJob(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(
      '*, customers(id, name, email, phone), vehicles(id, kenteken, make, model, colour, year), staff(id, name), job_events(id, event_type, from_stage, to_stage, note, created_at, staff(id, name)), job_photos(id, phase, storage_path, caption, created_at)'
    )
    .eq('id', id)
    .order('created_at', { referencedTable: 'job_events', ascending: false })
    .single();

  if (error) throw error;
  return data;
}

export async function getJobsByStage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, number, stage, notes, created_at, customers(id, name), vehicles(id, kenteken, make, model)'
    )
    .not('stage', 'eq', 'closed')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}
