import { createClient } from '@/lib/supabase/server';
import type { DocType, DocStatus } from '@/types/database';

const DOC_SELECT = `
  id, doc_type, doc_number, status, supersedes_id,
  job_id, offer_id, invoice_id, customer_id, vehicle_id,
  locale, payload, pdf_path, pdf_sha256,
  issued_at, issued_by, sent_at,
  signed_at, signed_by_name, signature_path,
  cancelled_at, cancel_reason,
  created_at, updated_at,
  customers(id, name, email),
  vehicles(id, kenteken, make, model)
`;

export async function getDocuments(filters?: {
  doc_type?: DocType;
  status?: DocStatus;
  customer_id?: string;
  job_id?: string;
  search?: string;
  year?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from('documents')
    .select(DOC_SELECT)
    .order('created_at', { ascending: false });

  if (filters?.doc_type) query = query.eq('doc_type', filters.doc_type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.job_id) query = query.eq('job_id', filters.job_id);
  if (filters?.search) {
    query = query.or(
      `doc_number.ilike.%${filters.search}%,customers.name.ilike.%${filters.search}%`
    );
  }
  if (filters?.year) {
    const start = `${filters.year}-01-01T00:00:00Z`;
    const end = `${filters.year + 1}-01-01T00:00:00Z`;
    query = query.gte('created_at', start).lt('created_at', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDocument(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`${DOC_SELECT}, staff:issued_by(id, name)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getDocumentChain(id: string) {
  const supabase = createClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, doc_type, doc_number, status, supersedes_id, job_id, created_at')
    .eq('id', id)
    .single();

  if (error) throw error;

  const chain = [doc];

  if (doc.job_id) {
    const { data: related } = await supabase
      .from('documents')
      .select('id, doc_type, doc_number, status, supersedes_id, job_id, created_at')
      .eq('job_id', doc.job_id)
      .neq('id', id)
      .order('created_at', { ascending: true });

    if (related) chain.push(...related);
  }

  return chain;
}

export async function getNumberRanges() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('number_ranges')
    .select('*')
    .order('year', { ascending: false });

  if (error) throw error;
  return data;
}
