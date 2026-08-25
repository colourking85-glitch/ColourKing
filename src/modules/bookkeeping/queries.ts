import { createClient } from '@/lib/supabase/server';

const INVOICE_EXPORT_SELECT = `
  id, invoice_number, status,
  subtotal_cents, vat_cents, total_cents,
  due_date, paid_at, payment_method,
  issued_at, sent_at,
  created_at,
  customers(id, name)
`;

const PURCHASE_EXPORT_SELECT = `
  id, purchase_number,
  supplier_name,
  invoice_date,
  subtotal_cents, vat_cents, total_cents,
  tax_code, category, description, reference,
  paid, paid_at
`;

const VAT_RETURN_EXPORT_SELECT = `
  id, period_type, year, period, status,
  box1a_supplies_high, box1b_supplies_low, box1c_supplies_other,
  box1d_private_use, box1e_supplies_zero, box2a_supplies_from_eu,
  box4a_vat_on_supplies, box4b_vat_on_eu,
  box5a_vat_deductible, box5b_vat_balance,
  box5c_small_business, box5d_estimate_previous,
  box5e_total_payable, box5f_total_refund,
  filed_at, notes
`;

export async function getInvoicesForExport(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_EXPORT_SELECT)
    .in('status', ['sent', 'paid', 'overdue', 'credited'])
    .gte('issued_at', startDate)
    .lte('issued_at', endDate + 'T23:59:59')
    .order('issued_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPurchasesForExport(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select(PURCHASE_EXPORT_SELECT)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .order('invoice_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getVatReturnsForExport(year: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vat_returns')
    .select(VAT_RETURN_EXPORT_SELECT)
    .eq('year', year)
    .in('status', ['filed', 'corrected'])
    .order('period', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type ProfitLossCategory = {
  category: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  count: number;
};

export type ProfitLossData = {
  revenue: {
    total_cents: number;
    vat_cents: number;
    count: number;
  };
  costs: {
    total_cents: number;
    vat_cents: number;
    count: number;
    byCategory: ProfitLossCategory[];
  };
  profit_cents: number;
};

export async function getProfitLoss(startDate: string, endDate: string): Promise<ProfitLossData> {
  const supabase = createClient();

  // Revenue from issued/paid invoices
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('subtotal_cents, vat_cents, total_cents')
    .in('status', ['sent', 'paid', 'overdue', 'credited'])
    .gte('issued_at', startDate)
    .lte('issued_at', endDate + 'T23:59:59');

  if (invErr) throw invErr;

  let revenueTotalCents = 0;
  let revenueVatCents = 0;
  for (const inv of invoices ?? []) {
    revenueTotalCents += inv.subtotal_cents;
    revenueVatCents += inv.vat_cents;
  }

  // Costs from purchases
  const { data: purchases, error: purErr } = await supabase
    .from('purchases')
    .select('category, subtotal_cents, vat_cents, total_cents')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  if (purErr) throw purErr;

  const byCategory: Record<string, ProfitLossCategory> = {};
  let costTotalCents = 0;
  let costVatCents = 0;

  for (const p of purchases ?? []) {
    if (!byCategory[p.category]) {
      byCategory[p.category] = {
        category: p.category,
        subtotal_cents: 0,
        vat_cents: 0,
        total_cents: 0,
        count: 0,
      };
    }
    byCategory[p.category].subtotal_cents += p.subtotal_cents;
    byCategory[p.category].vat_cents += p.vat_cents;
    byCategory[p.category].total_cents += p.total_cents;
    byCategory[p.category].count += 1;
    costTotalCents += p.subtotal_cents;
    costVatCents += p.vat_cents;
  }

  return {
    revenue: {
      total_cents: revenueTotalCents,
      vat_cents: revenueVatCents,
      count: (invoices ?? []).length,
    },
    costs: {
      total_cents: costTotalCents,
      vat_cents: costVatCents,
      count: (purchases ?? []).length,
      byCategory: Object.values(byCategory),
    },
    profit_cents: revenueTotalCents - costTotalCents,
  };
}
