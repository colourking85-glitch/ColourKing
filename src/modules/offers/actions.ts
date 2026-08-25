'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { OfferSchema, OfferLineSchema, ApproveOfferSchema, RejectOfferSchema } from './schema';
import { canTransition, getGuard } from './machine';
import type { OfferStatus } from '@/types/database';

const TAX_RATES: Record<string, number> = {
  H21: 0.21,
  L9: 0.09,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

export async function createOffer(input: unknown) {
  const data = OfferSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({ ...clean, status: 'draft' })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/offertes');
  return offer;
}

export async function updateOffer(id: string, input: unknown) {
  const data = OfferSchema.partial().parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'draft') {
    throw new Error('Only draft offers can be edited');
  }

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: offer, error } = await supabase
    .from('offers')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/offertes');
  revalidatePath(`/app/offertes/${id}`);
  return offer;
}

export async function deleteOffer(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'draft') {
    throw new Error('Only draft offers can be deleted');
  }

  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/offertes');
}

export async function addOfferLine(offerId: string, input: unknown) {
  const data = OfferLineSchema.parse(input);
  const supabase = createClient();

  // Check offer is draft
  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', offerId)
    .single();

  if (fetchErr) throw fetchErr;
  if (offer.status !== 'draft') {
    throw new Error('Can only add lines to draft offers');
  }

  // Calculate line total and VAT
  const grossCents = Math.round(data.quantity * data.unit_price_cents);
  const discountCents = Math.round(grossCents * data.discount_pct / 100);
  const line_total_cents = grossCents - discountCents;
  const vatRate = TAX_RATES[data.tax_code] ?? 0;
  const vat_amount_cents = Math.round(line_total_cents * vatRate);

  const { data: line, error } = await supabase
    .from('offer_lines')
    .insert({
      offer_id: offerId,
      ...data,
      line_total_cents,
      vat_amount_cents,
    })
    .select()
    .single();

  if (error) throw error;

  await recalculateOfferTotals(offerId);

  revalidatePath(`/app/offertes/${offerId}`);
  return line;
}

export async function updateOfferLine(lineId: string, input: unknown) {
  const data = OfferLineSchema.partial().parse(input);
  const supabase = createClient();

  // Get line + offer status
  const { data: existingLine, error: lineErr } = await supabase
    .from('offer_lines')
    .select('id, offer_id')
    .eq('id', lineId)
    .single();

  if (lineErr) throw lineErr;

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', existingLine.offer_id)
    .single();

  if (offerErr) throw offerErr;
  if (offer.status !== 'draft') {
    throw new Error('Can only edit lines on draft offers');
  }

  // If price-relevant fields changed, recalculate
  const updateData: Record<string, unknown> = { ...data };

  if (data.quantity !== undefined || data.unit_price_cents !== undefined || data.discount_pct !== undefined || data.tax_code !== undefined) {
    // Need full line to recalculate
    const { data: fullLine } = await supabase
      .from('offer_lines')
      .select('*')
      .eq('id', lineId)
      .single();

    if (fullLine) {
      const qty = data.quantity ?? fullLine.quantity;
      const upc = data.unit_price_cents ?? fullLine.unit_price_cents;
      const disc = data.discount_pct ?? fullLine.discount_pct;
      const tc = data.tax_code ?? fullLine.tax_code;

      const grossCents = Math.round(Number(qty) * upc);
      const discountCents = Math.round(grossCents * Number(disc) / 100);
      updateData.line_total_cents = grossCents - discountCents;
      const vatRate = TAX_RATES[tc] ?? 0;
      updateData.vat_amount_cents = Math.round((updateData.line_total_cents as number) * vatRate);
    }
  }

  const { data: line, error } = await supabase
    .from('offer_lines')
    .update(updateData)
    .eq('id', lineId)
    .select()
    .single();

  if (error) throw error;

  await recalculateOfferTotals(existingLine.offer_id);

  revalidatePath(`/app/offertes/${existingLine.offer_id}`);
  return line;
}

export async function removeOfferLine(lineId: string) {
  const supabase = createClient();

  const { data: line, error: lineErr } = await supabase
    .from('offer_lines')
    .select('id, offer_id')
    .eq('id', lineId)
    .single();

  if (lineErr) throw lineErr;

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', line.offer_id)
    .single();

  if (offerErr) throw offerErr;
  if (offer.status !== 'draft') {
    throw new Error('Can only remove lines from draft offers');
  }

  const { error } = await supabase
    .from('offer_lines')
    .delete()
    .eq('id', lineId);

  if (error) throw error;

  await recalculateOfferTotals(line.offer_id);

  revalidatePath(`/app/offertes/${line.offer_id}`);
}

export async function recalculateOfferTotals(offerId: string) {
  const supabase = createClient();

  const { data: lines, error: linesErr } = await supabase
    .from('offer_lines')
    .select('line_total_cents, vat_amount_cents')
    .eq('offer_id', offerId);

  if (linesErr) throw linesErr;

  const subtotal_cents = (lines ?? []).reduce((sum, l) => sum + l.line_total_cents, 0);
  const vat_cents = (lines ?? []).reduce((sum, l) => sum + l.vat_amount_cents, 0);
  const total_cents = subtotal_cents + vat_cents;

  const { error } = await supabase
    .from('offers')
    .update({ subtotal_cents, vat_cents, total_cents })
    .eq('id', offerId);

  if (error) throw error;
}

async function transitionOffer(id: string, to: OfferStatus) {
  const supabase = createClient();

  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const from = offer.status as OfferStatus;
  if (!canTransition(from, to)) {
    throw new Error(`Cannot transition from ${from} to ${to}`);
  }

  const guard = getGuard(from, to);
  if (guard === 'has_lines') {
    const { count, error: countErr } = await supabase
      .from('offer_lines')
      .select('id', { count: 'exact', head: true })
      .eq('offer_id', id);

    if (countErr) throw countErr;
    if (!count || count === 0) {
      throw new Error('Offer must have at least one line before sending');
    }
  }

  return { offer, supabase };
}

export async function sendOffer(id: string) {
  const { supabase } = await transitionOffer(id, 'sent');

  const { data: offer, error } = await supabase
    .from('offers')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/offertes');
  revalidatePath(`/app/offertes/${id}`);
  return offer;
}

export async function approveOffer(id: string, name: string, ip?: string) {
  const parsed = ApproveOfferSchema.parse({ id, approved_by_name: name });
  const { supabase } = await transitionOffer(parsed.id, 'approved');

  const updateData: Record<string, unknown> = {
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by_name: parsed.approved_by_name,
  };
  if (ip) updateData.approved_ip = ip;

  const { data: offer, error } = await supabase
    .from('offers')
    .update(updateData)
    .eq('id', parsed.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/offertes');
  revalidatePath(`/app/offertes/${parsed.id}`);
  return offer;
}

export async function rejectOffer(id: string, reason: string) {
  const parsed = RejectOfferSchema.parse({ id, rejected_reason: reason });
  const { supabase } = await transitionOffer(parsed.id, 'rejected');

  const { data: offer, error } = await supabase
    .from('offers')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_reason: parsed.rejected_reason,
    })
    .eq('id', parsed.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/offertes');
  revalidatePath(`/app/offertes/${parsed.id}`);
  return offer;
}

export async function supersedeOffer(id: string) {
  const supabase = createClient();

  const { data: oldOffer, error: fetchErr } = await supabase
    .from('offers')
    .select('*, offer_lines(*)')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (oldOffer.status !== 'sent') {
    throw new Error('Only sent offers can be superseded');
  }

  // Mark old as superseded
  const { error: updateErr } = await supabase
    .from('offers')
    .update({ status: 'superseded' })
    .eq('id', id);

  if (updateErr) throw updateErr;

  // Create new offer copying fields
  const { data: newOffer, error: insertErr } = await supabase
    .from('offers')
    .insert({
      type: oldOffer.type,
      origin: oldOffer.origin,
      customer_id: oldOffer.customer_id,
      vehicle_id: oldOffer.vehicle_id,
      lead_id: oldOffer.lead_id,
      job_id: oldOffer.job_id,
      parent_offer_id: oldOffer.parent_offer_id,
      supersedes_id: id,
      locale: oldOffer.locale,
      valid_until: oldOffer.valid_until,
      notes: oldOffer.notes,
      status: 'draft',
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  // Copy lines
  if (oldOffer.offer_lines?.length) {
    const newLines = oldOffer.offer_lines.map((l: Record<string, unknown>) => ({
      offer_id: newOffer.id,
      sort_order: l.sort_order,
      kind: l.kind,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price_cents: l.unit_price_cents,
      discount_pct: l.discount_pct,
      line_total_cents: l.line_total_cents,
      tax_code: l.tax_code,
      vat_amount_cents: l.vat_amount_cents,
      part_number: l.part_number,
    }));

    const { error: linesErr } = await supabase
      .from('offer_lines')
      .insert(newLines);

    if (linesErr) throw linesErr;
  }

  // Recalculate totals on new offer
  await recalculateOfferTotals(newOffer.id);

  revalidatePath('/app/offertes');
  revalidatePath(`/app/offertes/${id}`);
  return newOffer;
}
