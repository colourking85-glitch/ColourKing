'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PartSchema, UpdatePartSchema, PartStatusSchema } from './schema';
import type { PartStatus } from '@/types/database';

const VALID_TRANSITIONS: Record<PartStatus, PartStatus[]> = {
  needed: ['ordered', 'returned'],
  ordered: ['shipped'],
  shipped: ['received'],
  received: [],
  returned: [],
};

export async function createPart(input: unknown) {
  const data = PartSchema.parse(input);
  const supabase = createClient();

  const total_cents = data.quantity * data.unit_price_cents;

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: part, error } = await supabase
    .from('parts')
    .insert({ ...clean, total_cents, status: 'needed' })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/onderdelen');
  return part;
}

export async function updatePart(id: string, input: unknown) {
  const data = UpdatePartSchema.parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('parts')
    .select('id, quantity, unit_price_cents')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const quantity = data.quantity ?? existing.quantity;
  const unit_price_cents = data.unit_price_cents ?? existing.unit_price_cents;
  const total_cents = quantity * unit_price_cents;

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: part, error } = await supabase
    .from('parts')
    .update({ ...clean, total_cents })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/onderdelen');
  return part;
}

export async function deletePart(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('parts')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'needed') {
    throw new Error('Only parts with status "needed" can be deleted');
  }

  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/onderdelen');
}

export async function changePartStatus(id: string, newStatus: string) {
  const { status } = PartStatusSchema.parse({ status: newStatus });
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('parts')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const currentStatus = existing.status as PartStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(status)) {
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  const updates: Record<string, unknown> = { status };

  if (status === 'ordered') {
    updates.ordered_at = new Date().toISOString();
  }
  if (status === 'received') {
    updates.received_at = new Date().toISOString();
  }

  const { data: part, error } = await supabase
    .from('parts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/onderdelen');
  return part;
}

export async function setBlocking(id: string, blocking: boolean) {
  const supabase = createClient();

  const { data: part, error } = await supabase
    .from('parts')
    .update({ blocking })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/onderdelen');
  return part;
}

export async function recalculatePartTotal(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('parts')
    .select('id, quantity, unit_price_cents')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const total_cents = existing.quantity * existing.unit_price_cents;

  const { data: part, error } = await supabase
    .from('parts')
    .update({ total_cents })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/onderdelen');
  return part;
}
