import { createClient } from '@/lib/supabase/server';

export async function getCustomers(search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('customers')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCustomer(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}

export async function getCustomerWithVehicles(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*, vehicles(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}
