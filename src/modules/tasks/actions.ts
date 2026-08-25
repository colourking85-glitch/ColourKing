'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { TaskSchema, UpdateTaskSchema, TaskStatusSchema, ClockOutSchema } from './schema';
import type { TaskStatus } from '@/types/database';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['done', 'blocked'],
  done: [],
  blocked: ['todo'],
};

export async function createTask(input: unknown) {
  const data = TaskSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: task, error } = await supabase
    .from('job_tasks')
    .insert({ ...clean, status: 'todo' })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  return task;
}

export async function updateTask(id: string, input: unknown) {
  const data = UpdateTaskSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: task, error } = await supabase
    .from('job_tasks')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  return task;
}

export async function deleteTask(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('job_tasks')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'todo') {
    throw new Error('Only tasks with status "todo" can be deleted');
  }

  const { error } = await supabase
    .from('job_tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/taken');
}

export async function changeTaskStatus(id: string, newStatus: string, blockedReason?: string) {
  const { status, blocked_reason } = TaskStatusSchema.parse({
    status: newStatus,
    blocked_reason: blockedReason,
  });

  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('job_tasks')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const currentStatus = existing.status as TaskStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(status)) {
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  const updates: Record<string, unknown> = { status };

  if (status === 'in_progress') {
    updates.started_at = new Date().toISOString();
  }
  if (status === 'done') {
    updates.completed_at = new Date().toISOString();
  }
  if (status === 'blocked') {
    updates.blocked_reason = blocked_reason ?? null;
  }
  if (status === 'todo') {
    updates.blocked_reason = null;
  }

  const { data: task, error } = await supabase
    .from('job_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  return task;
}

export async function assignTask(id: string, staffId: string | null) {
  const supabase = createClient();

  const { data: task, error } = await supabase
    .from('job_tasks')
    .update({ assigned_to: staffId })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  return task;
}

export async function generateTasksFromOffer(jobId: string, offerId: string) {
  const supabase = createClient();

  // Get offer lines (labour lines become tasks with estimated_minutes)
  const { data: lines, error: linesErr } = await supabase
    .from('offer_lines')
    .select('id, kind, description, quantity, unit, unit_price_cents')
    .eq('offer_id', offerId)
    .order('sort_order', { ascending: true });

  if (linesErr) throw linesErr;
  if (!lines || lines.length === 0) {
    throw new Error('No offer lines found');
  }

  const tasks = lines.map((line, idx) => {
    const isLabour = line.kind === 'labour';
    // For labour lines: quantity is hours, convert to minutes
    const estimatedMinutes = isLabour ? Math.round(Number(line.quantity) * 60) : null;

    return {
      job_id: jobId,
      offer_line_id: line.id,
      title: line.description,
      status: 'todo' as const,
      estimated_minutes: estimatedMinutes,
      sort_order: idx,
    };
  });

  const { data: created, error } = await supabase
    .from('job_tasks')
    .insert(tasks)
    .select();

  if (error) throw error;

  revalidatePath('/app/taken');
  return created;
}

export async function clockIn(staffId: string, jobId?: string, taskId?: string) {
  const supabase = createClient();

  // Check for existing active entry
  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('staff_id', staffId)
    .is('clock_out', null)
    .limit(1)
    .maybeSingle();

  if (active) {
    throw new Error('Already clocked in. Clock out first.');
  }

  const entry: Record<string, unknown> = {
    staff_id: staffId,
    clock_in: new Date().toISOString(),
  };
  if (jobId) entry.job_id = jobId;
  if (taskId) entry.task_id = taskId;

  const { data: timeEntry, error } = await supabase
    .from('time_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  revalidatePath('/app/planning');
  return timeEntry;
}

export async function clockOut(timeEntryId: string, breakMinutes?: number, notes?: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('time_entries')
    .select('id, clock_in, clock_out')
    .eq('id', timeEntryId)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.clock_out) {
    throw new Error('Already clocked out');
  }

  const now = new Date();
  const clockIn = new Date(existing.clock_in);
  const totalMinutes = Math.round((now.getTime() - clockIn.getTime()) / 60000);
  const netMinutes = Math.max(0, totalMinutes - (breakMinutes ?? 0));

  const parsed = ClockOutSchema.parse({
    clock_out: now.toISOString(),
    break_minutes: breakMinutes ?? 0,
    notes: notes ?? null,
  });

  const { data: entry, error } = await supabase
    .from('time_entries')
    .update({
      clock_out: parsed.clock_out,
      duration_minutes: netMinutes,
      break_minutes: parsed.break_minutes,
      notes: parsed.notes,
    })
    .eq('id', timeEntryId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/taken');
  revalidatePath('/app/planning');
  return entry;
}

export async function reorderTasks(jobId: string, taskIds: string[]) {
  const supabase = createClient();

  const updates = taskIds.map((id, idx) =>
    supabase
      .from('job_tasks')
      .update({ sort_order: idx })
      .eq('id', id)
      .eq('job_id', jobId)
  );

  await Promise.all(updates);

  revalidatePath('/app/taken');
}
