import { createClient } from '@/lib/supabase/server';
import type { OfferType, OfferStatus } from '@/types/database';

const OFFER_SELECT = `
  id, type, status, origin, offer_number,
  customer_id, vehicle_id, lead_id, job_id,
  parent_offer_id, supersedes_id,
  locale, valid_until, notes,
  subtotal_cents, vat_cents, total_cents, discount_cents,
  approved_at, approved_by_name, approved_ip,
  rejected_at, rejected_reason, sent_at,
  created_by, created_at, updated_at,
  customers(id, name, email),
  vehicles(id, kenteken, make, model)
`;

export async function getOffers(filters?: {
  type?: OfferType;
  status?: OfferStatus;
  customer_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('offers')
    .select(OFFER_SELECT)
    .order('created_at', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.search) {
    query = query.or(
      `offer_number.ilike.%${filters.search}%,customers.name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getOffer(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('offers')
    .select(`
      ${OFFER_SELECT},
      offer_lines(
        id, sort_order, kind, description,
        quantity, unit, unit_price_cents,
        discount_pct, line_total_cents,
        tax_code, vat_amount_cents, part_number,
        created_at
      ),
      staff:created_by(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Sort lines by sort_order
  if (data.offer_lines) {
    data.offer_lines.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  }

  return data;
}

export async function getOfferLines(offerId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('offer_lines')
    .select('*')
    .eq('offer_id', offerId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getOfferChain(id: string) {
  const supabase = createClient();

  const { data: offer, error } = await supabase
    .from('offers')
    .select('id, type, offer_number, status, supersedes_id, parent_offer_id, created_at')
    .eq('id', id)
    .single();

  if (error) throw error;

  const chain = [offer];

  // Find all offers that share the same parent or supersede each other
  if (offer.parent_offer_id || offer.supersedes_id) {
    const rootId = offer.parent_offer_id ?? offer.supersedes_id;
    const { data: related } = await supabase
      .from('offers')
      .select('id, type, offer_number, status, supersedes_id, parent_offer_id, created_at')
      .or(`id.eq.${rootId},parent_offer_id.eq.${rootId},supersedes_id.eq.${rootId}`)
      .neq('id', id)
      .order('created_at', { ascending: true });

    if (related) chain.push(...related);
  }

  // Also find offers that supersede this one
  const { data: successors } = await supabase
    .from('offers')
    .select('id, type, offer_number, status, supersedes_id, parent_offer_id, created_at')
    .eq('supersedes_id', id)
    .order('created_at', { ascending: true });

  if (successors) {
    for (const s of successors) {
      if (!chain.find(c => c.id === s.id)) chain.push(s);
    }
  }

  return chain;
}
