'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { VehicleSchema } from './schema';

export async function createVehicle(input: unknown) {
  const data = VehicleSchema.parse(input);
  const supabase = createClient();

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/voertuigen');
  revalidatePath(`/app/klanten/${data.customer_id}`);
  return vehicle;
}

export async function updateVehicle(id: string, input: unknown) {
  const data = VehicleSchema.partial().parse(input);
  const supabase = createClient();

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/voertuigen');
  revalidatePath(`/app/voertuigen/${id}`);
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('vehicles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/app/voertuigen');
}
