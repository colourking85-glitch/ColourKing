import { createClient } from '@/lib/supabase/server';

export async function getLeads(status?: string, search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('leads')
    .select('*, customers(id, name), vehicles(id, kenteken, make, model)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`contact_name.ilike.%${search}%,contact_email.ilike.%${search}%,kenteken.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getLead(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, customers(id, name, email, phone), vehicles(id, kenteken, make, model, colour), lead_photos(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getLeadCounts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('status');

  if (error) throw error;

  const counts: Record<string, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
