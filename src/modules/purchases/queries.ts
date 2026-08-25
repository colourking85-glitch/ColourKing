import { createClient } from '@/lib/supabase/server';

const PURCHASE_SELECT = `
  id, purchase_number,
  supplier_name, supplier_vat_number,
  invoice_date, due_date,
  subtotal_cents, vat_cents, total_cents,
  tax_code, category, description, reference,
  paid, paid_at, payment_method,
  receipt_path, job_id,
  created_by, created_at, updated_at
`;

export async function listPurchases(filters?: {
  category?: string;
  paid?: 'all' | 'paid' | 'unpaid';
  date_from?: string;
  date_to?: string;
  search?: string;
  supplier?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .order('invoice_date', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.paid === 'paid') query = query.eq('paid', true);
  if (filters?.paid === 'unpaid') query = query.eq('paid', false);
  if (filters?.date_from) query = query.gte('invoice_date', filters.date_from);
  if (filters?.date_to) query = query.lte('invoice_date', filters.date_to);
  if (filters?.supplier) query = query.ilike('supplier_name', `%${filters.supplier}%`);
  if (filters?.search) {
    query = query.or(
      `supplier_name.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPurchase(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPurchasesByPeriod(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .order('invoice_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPurchaseSummary(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select('category, subtotal_cents, vat_cents, total_cents')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  if (error) throw error;

  const byCategory: Record<string, { subtotal_cents: number; vat_cents: number; total_cents: number; count: number }> = {};
  let totalSubtotal = 0;
  let totalVat = 0;
  let totalAmount = 0;

  for (const row of data ?? []) {
    if (!byCategory[row.category]) {
      byCategory[row.category] = { subtotal_cents: 0, vat_cents: 0, total_cents: 0, count: 0 };
    }
    byCategory[row.category].subtotal_cents += row.subtotal_cents;
    byCategory[row.category].vat_cents += row.vat_cents;
    byCategory[row.category].total_cents += row.total_cents;
    byCategory[row.category].count += 1;
    totalSubtotal += row.subtotal_cents;
    totalVat += row.vat_cents;
    totalAmount += row.total_cents;
  }

  return {
    byCategory,
    totals: {
      subtotal_cents: totalSubtotal,
      vat_cents: totalVat,
      total_cents: totalAmount,
      count: (data ?? []).length,
    },
  };
}
