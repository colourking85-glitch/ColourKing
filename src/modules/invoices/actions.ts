'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  InvoiceSchema,
  InvoiceLineSchema,
  CreateInvoiceFromOfferSchema,
  CreateCreditNoteSchema,
  RecordPaymentSchema,
} from './schema';
import { canTransition, getGuard } from './machine';
import type { InvoiceStatus } from '@/types/database';

const TAX_RATES: Record<string, number> = {
  H21: 0.21,
  L9: 0.09,
  N0: 0,
  V0: 0,
  M0: 0,
  ICP: 0,
  EX: 0,
};

export async function createInvoice(input: unknown) {
  const data = InvoiceSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      ...clean,
      status: 'draft',
      payment_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/facturen');
  return invoice;
}

export async function createInvoiceFromOffer(input: unknown) {
  const parsed = CreateInvoiceFromOfferSchema.parse(input);
  const supabase = createClient();

  // Get the approved offer with lines
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('*, offer_lines(*)')
    .eq('id', parsed.offer_id)
    .single();

  if (offerErr) throw offerErr;

  if (offer.status !== 'approved') {
    throw new Error('Only approved offers can be converted to invoices');
  }

  // Calculate due date (default 30 days)
  const dueDate = parsed.due_date ?? new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  // Calculate tax summary
  const taxSummary = buildTaxSummary(offer.offer_lines ?? []);

  // Create invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      status: 'draft',
      customer_id: offer.customer_id,
      vehicle_id: offer.vehicle_id,
      job_id: offer.job_id,
      offer_id: offer.id,
      locale: offer.locale,
      subtotal_cents: offer.subtotal_cents,
      vat_cents: offer.vat_cents,
      total_cents: offer.total_cents,
      discount_cents: offer.discount_cents,
      tax_summary: taxSummary,
      due_date: dueDate,
      terms: parsed.terms ?? null,
      payment_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (invErr) throw invErr;

  // Copy offer lines to invoice lines
  if (offer.offer_lines?.length) {
    const invoiceLines = offer.offer_lines.map((l: Record<string, unknown>) => ({
      invoice_id: invoice.id,
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
      .from('invoice_lines')
      .insert(invoiceLines);

    if (linesErr) throw linesErr;
  }

  revalidatePath('/app/facturen');
  return invoice;
}

export async function updateInvoice(id: string, input: unknown) {
  const data = InvoiceSchema.partial().parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'draft') {
    throw new Error('Only draft invoices can be edited');
  }

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/facturen');
  revalidatePath(`/app/facturen/${id}`);
  return invoice;
}

export async function deleteInvoice(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'draft') {
    throw new Error('Only draft invoices can be deleted');
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/facturen');
}

export async function addInvoiceLine(invoiceId: string, input: unknown) {
  const data = InvoiceLineSchema.parse(input);
  const supabase = createClient();

  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .single();

  if (fetchErr) throw fetchErr;
  if (invoice.status !== 'draft') {
    throw new Error('Can only add lines to draft invoices');
  }

  const grossCents = Math.round(data.quantity * data.unit_price_cents);
  const discountCents = Math.round(grossCents * data.discount_pct / 100);
  const line_total_cents = grossCents - discountCents;
  const vatRate = TAX_RATES[data.tax_code] ?? 0;
  const vat_amount_cents = Math.round(line_total_cents * vatRate);

  const { data: line, error } = await supabase
    .from('invoice_lines')
    .insert({
      invoice_id: invoiceId,
      ...data,
      line_total_cents,
      vat_amount_cents,
    })
    .select()
    .single();

  if (error) throw error;

  await recalculateInvoiceTotals(invoiceId);

  revalidatePath(`/app/facturen/${invoiceId}`);
  return line;
}

export async function removeInvoiceLine(lineId: string) {
  const supabase = createClient();

  const { data: line, error: lineErr } = await supabase
    .from('invoice_lines')
    .select('id, invoice_id')
    .eq('id', lineId)
    .single();

  if (lineErr) throw lineErr;

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', line.invoice_id)
    .single();

  if (invErr) throw invErr;
  if (invoice.status !== 'draft') {
    throw new Error('Can only remove lines from draft invoices');
  }

  const { error } = await supabase
    .from('invoice_lines')
    .delete()
    .eq('id', lineId);

  if (error) throw error;

  await recalculateInvoiceTotals(line.invoice_id);

  revalidatePath(`/app/facturen/${line.invoice_id}`);
}

export async function recalculateInvoiceTotals(invoiceId: string) {
  const supabase = createClient();

  const { data: lines, error: linesErr } = await supabase
    .from('invoice_lines')
    .select('line_total_cents, vat_amount_cents, tax_code')
    .eq('invoice_id', invoiceId);

  if (linesErr) throw linesErr;

  const subtotal_cents = (lines ?? []).reduce((sum, l) => sum + l.line_total_cents, 0);
  const vat_cents = (lines ?? []).reduce((sum, l) => sum + l.vat_amount_cents, 0);
  const total_cents = subtotal_cents + vat_cents;
  const tax_summary = buildTaxSummary(lines ?? []);

  const { error } = await supabase
    .from('invoices')
    .update({ subtotal_cents, vat_cents, total_cents, tax_summary })
    .eq('id', invoiceId);

  if (error) throw error;
}

async function transitionInvoice(id: string, to: InvoiceStatus) {
  const supabase = createClient();

  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const from = invoice.status as InvoiceStatus;
  if (!canTransition(from, to)) {
    throw new Error(`Cannot transition from ${from} to ${to}`);
  }

  const guard = getGuard(from, to);
  if (guard === 'has_lines') {
    const { count, error: countErr } = await supabase
      .from('invoice_lines')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', id);

    if (countErr) throw countErr;
    if (!count || count === 0) {
      throw new Error('Invoice must have at least one line before issuing');
    }
  }

  return { invoice, supabase };
}

export async function issueInvoice(id: string) {
  const { supabase } = await transitionInvoice(id, 'sent');

  // Allocate a gapless invoice number via the documents system
  const { data: numData, error: numErr } = await supabase
    .rpc('allocate_number', { p_doc_type: 'invoice' });

  if (numErr) throw numErr;

  const now = new Date().toISOString();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      invoice_number: numData,
      issued_at: now,
      sent_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Also create a document record for the archive
  const { data: inv } = await supabase
    .from('invoices')
    .select('customer_id, vehicle_id, job_id, offer_id, locale, subtotal_cents, vat_cents, total_cents')
    .eq('id', id)
    .single();

  if (inv) {
    await supabase.from('documents').insert({
      doc_type: 'invoice',
      doc_number: numData,
      status: 'issued',
      invoice_id: id,
      customer_id: inv.customer_id,
      vehicle_id: inv.vehicle_id,
      job_id: inv.job_id,
      offer_id: inv.offer_id,
      locale: inv.locale,
      issued_at: now,
      payload: {
        subtotal_cents: inv.subtotal_cents,
        vat_cents: inv.vat_cents,
        total_cents: inv.total_cents,
      },
    });
  }

  revalidatePath('/app/facturen');
  revalidatePath(`/app/facturen/${id}`);
  return invoice;
}

export async function createCreditNote(input: unknown) {
  const parsed = CreateCreditNoteSchema.parse(input);
  const supabase = createClient();

  // Get the original invoice with lines
  const { data: original, error: fetchErr } = await supabase
    .from('invoices')
    .select('*, invoice_lines(*)')
    .eq('id', parsed.invoice_id)
    .single();

  if (fetchErr) throw fetchErr;

  if (original.status !== 'sent' && original.status !== 'paid' && original.status !== 'overdue') {
    throw new Error('Can only create credit notes for sent, paid, or overdue invoices');
  }

  // Allocate a credit note number
  const { data: numData, error: numErr } = await supabase
    .rpc('allocate_number', { p_doc_type: 'credit_note' });

  if (numErr) throw numErr;

  const now = new Date().toISOString();

  // Create negative mirror invoice
  const { data: creditNote, error: cnErr } = await supabase
    .from('invoices')
    .insert({
      status: 'sent',
      invoice_number: numData,
      customer_id: original.customer_id,
      vehicle_id: original.vehicle_id,
      job_id: original.job_id,
      offer_id: original.offer_id,
      locale: original.locale,
      subtotal_cents: -original.subtotal_cents,
      vat_cents: -original.vat_cents,
      total_cents: -original.total_cents,
      discount_cents: -original.discount_cents,
      tax_summary: negateTaxSummary(original.tax_summary),
      notes: parsed.reason,
      credit_note_id: original.id,
      issued_at: now,
      sent_at: now,
      payment_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (cnErr) throw cnErr;

  // Copy lines as negative
  if (original.invoice_lines?.length) {
    const negLines = original.invoice_lines.map((l: Record<string, unknown>) => ({
      invoice_id: creditNote.id,
      sort_order: l.sort_order as number,
      kind: l.kind as string,
      description: l.description as string,
      quantity: -(l.quantity as number),
      unit: l.unit as string,
      unit_price_cents: l.unit_price_cents as number,
      discount_pct: l.discount_pct as number,
      line_total_cents: -(l.line_total_cents as number),
      tax_code: l.tax_code as string,
      vat_amount_cents: -(l.vat_amount_cents as number),
      part_number: l.part_number as string | null,
    }));

    await supabase.from('invoice_lines').insert(negLines);
  }

  // Mark original as credited
  await supabase
    .from('invoices')
    .update({ status: 'credited', cancelled_at: now })
    .eq('id', original.id);

  // Create document record
  await supabase.from('documents').insert({
    doc_type: 'credit_note',
    doc_number: numData,
    status: 'issued',
    invoice_id: creditNote.id,
    customer_id: original.customer_id,
    vehicle_id: original.vehicle_id,
    job_id: original.job_id,
    locale: original.locale,
    issued_at: now,
    payload: {
      original_invoice_id: original.id,
      original_invoice_number: original.invoice_number,
      reason: parsed.reason,
      total_cents: -original.total_cents,
    },
  });

  revalidatePath('/app/facturen');
  revalidatePath(`/app/facturen/${original.id}`);
  return creditNote;
}

export async function recordPayment(input: unknown) {
  const parsed = RecordPaymentSchema.parse(input);
  const supabase = createClient();

  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status, total_cents')
    .eq('id', parsed.invoice_id)
    .single();

  if (fetchErr) throw fetchErr;

  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new Error('Can only record payments for sent or overdue invoices');
  }

  const paidAt = parsed.paid_at ?? new Date().toISOString();

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: parsed.invoice_id,
      amount_cents: parsed.amount_cents,
      method: parsed.method,
      reference: parsed.reference ?? null,
      mollie_payment_id: parsed.mollie_payment_id ?? null,
      paid_at: paidAt,
    })
    .select()
    .single();

  if (payErr) throw payErr;

  // Check total payments vs invoice total
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('invoice_id', parsed.invoice_id);

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  if (totalPaid >= invoice.total_cents) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: paidAt,
        payment_method: parsed.method,
        payment_reference: parsed.reference ?? null,
      })
      .eq('id', parsed.invoice_id);
  }

  revalidatePath('/app/facturen');
  revalidatePath(`/app/facturen/${parsed.invoice_id}`);
  return payment;
}

export async function markOverdue(id: string) {
  const { supabase } = await transitionInvoice(id, 'overdue');

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/facturen');
  revalidatePath(`/app/facturen/${id}`);
  return invoice;
}

function buildTaxSummary(lines: Array<{ tax_code: string; line_total_cents: number; vat_amount_cents: number }>) {
  const summary: Record<string, { base_cents: number; vat_cents: number; rate: number }> = {};

  for (const line of lines) {
    if (!summary[line.tax_code]) {
      summary[line.tax_code] = {
        base_cents: 0,
        vat_cents: 0,
        rate: (TAX_RATES[line.tax_code] ?? 0) * 100,
      };
    }
    summary[line.tax_code].base_cents += line.line_total_cents;
    summary[line.tax_code].vat_cents += line.vat_amount_cents;
  }

  return summary;
}

function negateTaxSummary(summary: unknown) {
  if (!summary || typeof summary !== 'object') return null;
  const result: Record<string, { base_cents: number; vat_cents: number; rate: number }> = {};
  for (const [code, val] of Object.entries(summary as Record<string, { base_cents: number; vat_cents: number; rate: number }>)) {
    result[code] = {
      base_cents: -val.base_cents,
      vat_cents: -val.vat_cents,
      rate: val.rate,
    };
  }
  return result;
}
