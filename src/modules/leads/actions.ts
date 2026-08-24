'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { LeadSchema } from './schema';

export async function createLead(input: unknown) {
  const data = LeadSchema.parse(input);
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/leads');
  return lead;
}

export async function updateLead(id: string, input: unknown) {
  const data = LeadSchema.partial().parse(input);
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/leads');
  revalidatePath(`/app/leads/${id}`);
  return lead;
}

export async function updateLeadStatus(id: string, status: string, lostReason?: string) {
  const supabase = createClient();

  const update: Record<string, unknown> = { status };
  if (status === 'lost' && lostReason) {
    update.lost_reason = lostReason;
  }

  const { error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/app/leads');
  revalidatePath(`/app/leads/${id}`);
}
