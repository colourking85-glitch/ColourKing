import { createClient } from '@/lib/supabase/server';
import type { VatReturnStatus, VatPeriodType } from '@/types/database';

const VAT_RETURN_SELECT = `
  id, period_type, year, period, status,
  box1a_supplies_high, box1b_supplies_low, box1c_supplies_other,
  box1d_private_use, box1e_supplies_zero, box2a_supplies_from_eu,
  box4a_vat_on_supplies, box4b_vat_on_eu,
  box5a_vat_deductible, box5b_vat_balance,
  box5c_small_business, box5d_estimate_previous,
  box5e_total_payable, box5f_total_refund,
  filed_at, filed_by, notes, locked,
  created_at, updated_at,
  filer:filed_by(id, name)
`;

export async function listVatReturns(filters?: {
  year?: number;
  status?: VatReturnStatus;
}) {
  const supabase = createClient();
  let query = supabase
    .from('vat_returns')
    .select(VAT_RETURN_SELECT)
    .order('year', { ascending: false })
    .order('period', { ascending: true });

  if (filters?.year) query = query.eq('year', filters.year);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getVatReturn(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vat_returns')
    .select(VAT_RETURN_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getVatReturnByPeriod(
  year: number,
  period: number,
  periodType: VatPeriodType
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vat_returns')
    .select(VAT_RETURN_SELECT)
    .eq('year', year)
    .eq('period', period)
    .eq('period_type', periodType)
    .maybeSingle();

  if (error) throw error;
  return data;
}
