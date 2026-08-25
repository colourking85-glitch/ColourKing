import { createClient } from '@/lib/supabase/server';
import type { PartStatus } from '@/types/database';

const PART_SELECT = `
  id, job_id, offer_line_id, description, part_number,
  supplier, quantity, unit_price_cents, total_cents,
  status, ordered_at, expected_at, received_at,
  blocking, notes, created_by,
  created_at, updated_at,
  jobs(id, job_number)
`;

export async function getParts(filters?: {
  job_id?: string;
  status?: PartStatus;
  blocking?: boolean;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('parts')
    .select(PART_SELECT)
    .order('created_at', { ascending: false });

  if (filters?.job_id) query = query.eq('job_id', filters.job_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.blocking !== undefined) query = query.eq('blocking', filters.blocking);
  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%,supplier.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPart(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parts')
    .select(`${PART_SELECT}, staff:created_by(id, name)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getBlockingParts(jobId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parts')
    .select(PART_SELECT)
    .eq('job_id', jobId)
    .eq('blocking', true)
    .neq('status', 'received')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
