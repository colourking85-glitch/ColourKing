'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  PurchaseSchema,
  PurchaseUpdateSchema,
  MarkPaidSchema,
  calcVatCents,
  calcTotalCents,
} from './schema';

export async function createPurchase(input: unknown) {
  const data = PurchaseSchema.parse(input);
  const supabase = createClient();

  const vat_cents = calcVatCents(data.subtotal_cents, data.tax_code);
  const total_cents = calcTotalCents(data.subtotal_cents, vat_cents);

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      ...clean,
      vat_cents,
      total_cents,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/inkoop');
  return purchase;
}

export async function updatePurchase(id: string, input: unknown) {
  const data = PurchaseUpdateSchema.parse(input);
  const supabase = createClient();

  const clean: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  // Recalculate totals if subtotal or tax_code changed
  if (data.subtotal_cents !== undefined || data.tax_code !== undefined) {
    // Fetch existing values for fields not provided
    const { data: existing, error: fetchErr } = await supabase
      .from('purchases')
      .select('subtotal_cents, tax_code')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const subtotal = data.subtotal_cents ?? existing.subtotal_cents;
    const taxCode = data.tax_code ?? existing.tax_code;
    const vat_cents = calcVatCents(subtotal, taxCode);
    const total_cents = calcTotalCents(subtotal, vat_cents);

    clean.vat_cents = vat_cents;
    clean.total_cents = total_cents;
  }

  const { data: purchase, error } = await supabase
    .from('purchases')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/inkoop');
  return purchase;
}

export async function markPaid(id: string, input: unknown) {
  const data = MarkPaidSchema.parse(input);
  const supabase = createClient();

  const paidAt = data.paid_at ?? new Date().toISOString();

  const { data: purchase, error } = await supabase
    .from('purchases')
    .update({
      paid: true,
      paid_at: paidAt,
      payment_method: data.payment_method,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/inkoop');
  return purchase;
}

export async function deletePurchase(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/inkoop');
}

export async function getDeductibleVat(startDate: string, endDate: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('purchases')
    .select('vat_cents, tax_code')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  if (error) throw error;

  // Only tax codes that allow VAT deduction (not ICP, EX which are 0% special)
  const deductibleCodes = ['H21', 'L9', 'V0', 'M0'];
  const totalDeductible = (data ?? [])
    .filter((row) => deductibleCodes.includes(row.tax_code))
    .reduce((sum, row) => sum + row.vat_cents, 0);

  return totalDeductible;
}
