'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { VatReturnSchema, CalculateVatSchema } from './schema';
import type { VatPeriodType, TaxCode } from '@/types/database';

/** Tax rates matching the Dutch BTW system */
const TAX_RATES: Record<string, number> = {
  H21: 21,
  L9: 9,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

/**
 * Get date range for a VAT period.
 * For quarters: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
 * For months: 1=Jan, 2=Feb, etc.
 */
export function getPeriodDateRange(
  year: number,
  period: number,
  periodType: VatPeriodType
): { start: string; end: string } {
  if (periodType === 'quarter') {
    const startMonth = (period - 1) * 3; // 0-indexed
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
  // month
  const start = new Date(year, period - 1, 1);
  const end = new Date(year, period, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Calculate VAT return amounts from invoices for a given period.
 * Queries invoice_lines for all issued/paid invoices in the period,
 * groups by tax_code, and computes all BTW box amounts.
 */
export async function calculateVatReturn(
  year: number,
  period: number,
  periodType: VatPeriodType
) {
  CalculateVatSchema.parse({ year, period, period_type: periodType });

  const supabase = createClient();
  const { start, end } = getPeriodDateRange(year, period, periodType);

  // Get all invoice lines from issued/paid/overdue invoices in the period
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, status, issued_at,
      invoice_lines(
        id, line_total_cents, vat_amount_cents, tax_code
      )
    `)
    .in('status', ['sent', 'paid', 'overdue'])
    .gte('issued_at', start)
    .lte('issued_at', end);

  if (invErr) throw invErr;

  // Aggregate by tax code
  const totals: Record<string, { base_cents: number; vat_cents: number }> = {};

  for (const inv of invoices ?? []) {
    for (const line of (inv.invoice_lines ?? []) as Array<{
      line_total_cents: number;
      vat_amount_cents: number;
      tax_code: TaxCode;
    }>) {
      const code = line.tax_code;
      if (!totals[code]) totals[code] = { base_cents: 0, vat_cents: 0 };
      totals[code].base_cents += line.line_total_cents;
      totals[code].vat_cents += line.vat_amount_cents;
    }
  }

  // Compute box amounts (all in cents, integers)
  const box1a = totals['H21']?.base_cents ?? 0;
  const box1b = totals['L9']?.base_cents ?? 0;
  const box1c = (totals['M0']?.base_cents ?? 0);
  const box1e = (totals['N0']?.base_cents ?? 0) + (totals['V0']?.base_cents ?? 0) + (totals['EX']?.base_cents ?? 0);
  const box2a = totals['ICP']?.base_cents ?? 0;

  // VAT amounts
  const vatH21 = totals['H21']?.vat_cents ?? 0;
  const vatL9 = totals['L9']?.vat_cents ?? 0;
  const vatM0 = totals['M0']?.vat_cents ?? 0;
  const box4a = vatH21 + vatL9 + vatM0;
  const box4b = totals['ICP']?.vat_cents ?? 0;

  // Input VAT (placeholder -- will be filled by Sprint 15 with purchase invoices)
  const box5a = 0;

  const box5b = box4a + box4b - box5a;
  const box5c = 0; // Small business scheme -- manual entry
  const box5d = 0; // Previous period estimates -- manual entry
  const netBalance = box5b - box5c - box5d;
  const box5e = Math.max(0, netBalance);
  const box5f = Math.max(0, -netBalance);

  return {
    period_type: periodType,
    year,
    period,
    box1a_supplies_high: box1a,
    box1b_supplies_low: box1b,
    box1c_supplies_other: box1c,
    box1d_private_use: 0,
    box1e_supplies_zero: box1e,
    box2a_supplies_from_eu: box2a,
    box4a_vat_on_supplies: box4a,
    box4b_vat_on_eu: box4b,
    box5a_vat_deductible: box5a,
    box5b_vat_balance: box5b,
    box5c_small_business: box5c,
    box5d_estimate_previous: box5d,
    box5e_total_payable: box5e,
    box5f_total_refund: box5f,
  };
}

/**
 * Create or update a VAT return draft.
 * BLOCKED if the period is locked (filed).
 */
export async function createOrUpdateVatReturn(input: unknown) {
  const data = VatReturnSchema.parse(input);
  const supabase = createClient();

  // Check if a return already exists for this period
  const { data: existing } = await supabase
    .from('vat_returns')
    .select('id, locked, status')
    .eq('year', data.year)
    .eq('period', data.period)
    .eq('period_type', data.period_type)
    .maybeSingle();

  if (existing?.locked) {
    throw new Error('Cannot edit a locked VAT period. Use correction instead.');
  }

  const record = {
    period_type: data.period_type,
    year: data.year,
    period: data.period,
    status: data.status ?? ('draft' as const),
    box1a_supplies_high: data.box1a_supplies_high,
    box1b_supplies_low: data.box1b_supplies_low,
    box1c_supplies_other: data.box1c_supplies_other,
    box1d_private_use: data.box1d_private_use,
    box1e_supplies_zero: data.box1e_supplies_zero,
    box2a_supplies_from_eu: data.box2a_supplies_from_eu,
    box4a_vat_on_supplies: data.box4a_vat_on_supplies,
    box4b_vat_on_eu: data.box4b_vat_on_eu,
    box5a_vat_deductible: data.box5a_vat_deductible,
    box5b_vat_balance: data.box5b_vat_balance,
    box5c_small_business: data.box5c_small_business,
    box5d_estimate_previous: data.box5d_estimate_previous,
    box5e_total_payable: data.box5e_total_payable,
    box5f_total_refund: data.box5f_total_refund,
    notes: data.notes ?? null,
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('vat_returns')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/app/btw');
    return updated;
  }

  const { data: created, error } = await supabase
    .from('vat_returns')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/app/btw');
  return created;
}

/**
 * File a VAT return: sets status=filed, locked=true, records filed_at/by.
 * Only draft returns can be filed.
 */
export async function fileVatReturn(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('vat_returns')
    .select('id, status, locked')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'draft') {
    throw new Error('Only draft VAT returns can be filed');
  }

  if (existing.locked) {
    throw new Error('This VAT period is already locked');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const { data: filed, error } = await supabase
    .from('vat_returns')
    .update({
      status: 'filed',
      locked: true,
      filed_at: now,
      filed_by: user?.id ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/btw');
  return filed;
}

/**
 * Correct a filed VAT return: marks original as corrected,
 * creates a new draft entry for the same period to hold the correction.
 */
export async function correctVatReturn(id: string) {
  const supabase = createClient();

  const { data: original, error: fetchErr } = await supabase
    .from('vat_returns')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (original.status !== 'filed') {
    throw new Error('Only filed VAT returns can be corrected');
  }

  // Mark original as corrected and unlock it won't be editable since status != draft
  const { error: updateErr } = await supabase
    .from('vat_returns')
    .update({ status: 'corrected' })
    .eq('id', id);

  if (updateErr) throw updateErr;

  // Create a new draft for the same period with the same amounts
  // The user can then adjust the amounts
  const { data: correction, error: createErr } = await supabase
    .from('vat_returns')
    .insert({
      period_type: original.period_type,
      year: original.year,
      period: original.period,
      status: 'draft',
      locked: false,
      box1a_supplies_high: original.box1a_supplies_high,
      box1b_supplies_low: original.box1b_supplies_low,
      box1c_supplies_other: original.box1c_supplies_other,
      box1d_private_use: original.box1d_private_use,
      box1e_supplies_zero: original.box1e_supplies_zero,
      box2a_supplies_from_eu: original.box2a_supplies_from_eu,
      box4a_vat_on_supplies: original.box4a_vat_on_supplies,
      box4b_vat_on_eu: original.box4b_vat_on_eu,
      box5a_vat_deductible: original.box5a_vat_deductible,
      box5b_vat_balance: original.box5b_vat_balance,
      box5c_small_business: original.box5c_small_business,
      box5d_estimate_previous: original.box5d_estimate_previous,
      box5e_total_payable: original.box5e_total_payable,
      box5f_total_refund: original.box5f_total_refund,
      notes: `Correction of ${original.period_type === 'quarter' ? 'Q' : 'M'}${original.period} ${original.year}`,
    })
    .select()
    .single();

  if (createErr) throw createErr;

  revalidatePath('/app/btw');
  return correction;
}
