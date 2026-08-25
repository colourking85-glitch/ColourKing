import { createClient } from '@/lib/supabase/server';
import type { TaskStatus } from '@/types/database';

const TASK_SELECT = `
  id, job_id, offer_line_id, title, description,
  status, assigned_to, estimated_minutes, actual_minutes,
  sort_order, started_at, completed_at, blocked_reason,
  created_at, updated_at,
  jobs(id, job_number),
  staff:assigned_to(id, name)
`;

export async function getTasks(filters?: {
  job_id?: string;
  assigned_to?: string;
  status?: TaskStatus;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('job_tasks')
    .select(TASK_SELECT)
    .order('sort_order', { ascending: true });

  if (filters?.job_id) query = query.eq('job_id', filters.job_id);
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTask(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_tasks')
    .select(`${TASK_SELECT}`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getTasksForJob(jobId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_tasks')
    .select(TASK_SELECT)
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMyTasks(staffId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_tasks')
    .select(TASK_SELECT)
    .eq('assigned_to', staffId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  // Group by status
  const grouped: Record<TaskStatus, typeof data> = {
    in_progress: [],
    todo: [],
    blocked: [],
    done: [],
  };

  for (const task of data ?? []) {
    const s = task.status as TaskStatus;
    if (grouped[s]) grouped[s].push(task);
  }

  return grouped;
}

/* ---- Time entries ---- */

const TIME_ENTRY_SELECT = `
  id, staff_id, job_id, task_id,
  clock_in, clock_out, duration_minutes, break_minutes, notes,
  created_at, updated_at,
  staff:staff_id(id, name),
  jobs(id, job_number),
  job_tasks:task_id(id, title)
`;

export async function getTimeEntries(filters?: {
  staff_id?: string;
  job_id?: string;
  from?: string;
  to?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('time_entries')
    .select(TIME_ENTRY_SELECT)
    .order('clock_in', { ascending: false });

  if (filters?.staff_id) query = query.eq('staff_id', filters.staff_id);
  if (filters?.job_id) query = query.eq('job_id', filters.job_id);
  if (filters?.from) query = query.gte('clock_in', filters.from);
  if (filters?.to) query = query.lte('clock_in', filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getActiveTimeEntry(staffId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('time_entries')
    .select(TIME_ENTRY_SELECT)
    .eq('staff_id', staffId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTimesheetSummary(staffId: string, from: string, to: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, clock_in, clock_out, duration_minutes, break_minutes')
    .eq('staff_id', staffId)
    .gte('clock_in', from)
    .lte('clock_in', to)
    .not('clock_out', 'is', null)
    .order('clock_in', { ascending: true });

  if (error) throw error;

  // Group by date, sum minutes per day
  const byDay: Record<string, number> = {};
  for (const entry of data ?? []) {
    const day = new Date(entry.clock_in).toISOString().slice(0, 10);
    const mins = entry.duration_minutes ?? 0;
    byDay[day] = (byDay[day] ?? 0) + mins;
  }

  return byDay;
}
