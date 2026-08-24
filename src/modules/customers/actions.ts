'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CustomerSchema } from './schema';

export async function createCustomer(input: unknown) {
  const data = CustomerSchema.parse(input);
  const supabase = createClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/klanten');
  return customer;
}

export async function updateCustomer(id: string, input: unknown) {
  const data = CustomerSchema.partial().parse(input);
  const supabase = createClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/klanten');
  revalidatePath(`/app/klanten/${id}`);
  return customer;
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/app/klanten');
}
