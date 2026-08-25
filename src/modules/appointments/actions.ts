'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  AppointmentSchema,
  UpdateAppointmentSchema,
  ResourceSchema,
  BlackoutSchema,
  OpeningHoursSchema,
} from './schema';

export async function createAppointment(input: unknown) {
  const data = AppointmentSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  // Auto-confirm inspection appointments
  const isInspection = data.type === 'inspection';
  const status = isInspection ? 'confirmed' : 'requested';

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      ...clean,
      status,
      ...(isInspection ? { confirmed_at: new Date().toISOString() } : {}),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return appointment;
}

export async function updateAppointment(id: string, input: unknown) {
  const data = UpdateAppointmentSchema.parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status === 'cancelled' || existing.status === 'completed') {
    throw new Error(`Cannot update a ${existing.status} appointment`);
  }

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return appointment;
}

export async function confirmAppointment(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'requested') {
    throw new Error(`Can only confirm requested appointments, current status: ${existing.status}`);
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return appointment;
}

export async function cancelAppointment(id: string, reason: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status === 'cancelled') {
    throw new Error('Appointment is already cancelled');
  }
  if (existing.status === 'completed') {
    throw new Error('Cannot cancel a completed appointment');
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return appointment;
}

export async function completeAppointment(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'confirmed') {
    throw new Error(`Can only complete confirmed appointments, current status: ${existing.status}`);
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return appointment;
}

export async function deleteAppointment(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'requested' && existing.status !== 'cancelled') {
    throw new Error('Only requested or cancelled appointments can be deleted');
  }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/afspraken');
}

export async function createResource(input: unknown) {
  const data = ResourceSchema.parse(input);
  const supabase = createClient();

  const { data: resource, error } = await supabase
    .from('resources')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return resource;
}

export async function updateResource(id: string, input: unknown) {
  const data = ResourceSchema.partial().parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: resource, error } = await supabase
    .from('resources')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return resource;
}

export async function createBlackout(input: unknown) {
  const data = BlackoutSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: blackout, error } = await supabase
    .from('blackouts')
    .insert(clean)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/afspraken');
  return blackout;
}

export async function deleteBlackout(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('blackouts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/afspraken');
}

export async function updateOpeningHours(entries: unknown[]) {
  const parsed = entries.map(e => OpeningHoursSchema.parse(e));
  const supabase = createClient();

  // Delete all existing entries
  const { error: deleteErr } = await supabase
    .from('opening_hours')
    .delete()
    .gte('day_of_week', 0);

  if (deleteErr) throw deleteErr;

  // Insert new entries
  if (parsed.length > 0) {
    const { error: insertErr } = await supabase
      .from('opening_hours')
      .insert(parsed);

    if (insertErr) throw insertErr;
  }

  revalidatePath('/app/afspraken');
}
