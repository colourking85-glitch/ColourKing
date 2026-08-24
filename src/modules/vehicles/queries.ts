import { createClient } from '@/lib/supabase/server';

export async function getVehicles(search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('vehicles')
    .select('*, customers(id, name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`kenteken.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getVehicle(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, customers(id, name, email, phone)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}

export async function getVehiclesByCustomer(customerId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
