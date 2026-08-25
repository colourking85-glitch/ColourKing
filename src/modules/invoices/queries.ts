import { createClient } from '@/lib/supabase/server';
import type { InvoiceStatus } from '@/types/database';

const INVOICE_SELECT = `
  id, invoice_number, status,
  customer_id, vehicle_id, job_id, offer_id,
  locale,
  subtotal_cents, vat_cents, total_cents, discount_cents, tax_summary,
  due_date, paid_at, payment_method, payment_reference, mollie_payment_id,
  notes, terms,
  created_by, issued_at, issued_by, sent_at, cancelled_at,
  credit_note_id, payment_token,
  created_at, updated_at,
  customers(id, name, email, phone, address, postcode, city, country, kvk_number, btw_number, type),
  vehicles(id, kenteken, make, model)
`;

export async function listInvoices(filters?: {
  status?: InvoiceStatus;
  customer_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.search) {
    query = query.or(
      `invoice_number.ilike.%${filters.search}%,customers.name.ilike.%${filters.search}%`
    );
  }
  if (filters?.date_from) query = query.gte('created_at', filters.date_from);
  if (filters?.date_to) query = query.lte('created_at', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getInvoice(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      ${INVOICE_SELECT},
      invoice_lines(
        id, sort_order, kind, description,
        quantity, unit, unit_price_cents,
        discount_pct, line_total_cents,
        tax_code, vat_amount_cents, part_number,
        created_at
      ),
      payments(
        id, amount_cents, method, reference,
        mollie_payment_id, mollie_status, paid_at,
        created_at
      ),
      staff:created_by(id, name),
      issuer:issued_by(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Sort lines by sort_order
  if (data.invoice_lines) {
    data.invoice_lines.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  }

  // Sort payments by created_at
  if (data.payments) {
    data.payments.sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return data;
}

export async function getInvoiceByToken(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, status,
      subtotal_cents, vat_cents, total_cents, discount_cents,
      due_date, paid_at, locale,
      customers(id, name, email),
      invoice_lines(
        id, sort_order, kind, description,
        quantity, unit, unit_price_cents,
        discount_pct, line_total_cents,
        tax_code, vat_amount_cents,
        created_at
      )
    `)
    .eq('payment_token', token)
    .single();

  if (error) throw error;

  if (data.invoice_lines) {
    data.invoice_lines.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  }

  return data;
}

export async function getInvoiceChain(id: string) {
  const supabase = createClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, credit_note_id, created_at')
    .eq('id', id)
    .single();

  if (error) throw error;

  const chain = [invoice];

  // Find credit notes linked to this invoice
  const { data: creditNotes } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, credit_note_id, created_at')
    .eq('credit_note_id', id)
    .order('created_at', { ascending: true });

  if (creditNotes) chain.push(...creditNotes);

  // If this is a credit note, find the original invoice
  if (invoice.credit_note_id) {
    const { data: original } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, credit_note_id, created_at')
      .eq('id', invoice.credit_note_id)
      .single();

    if (original && !chain.find(c => c.id === original.id)) {
      chain.unshift(original);
    }
  }

  return chain;
}
