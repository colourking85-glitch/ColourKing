import { createClient } from '@/lib/supabase/server';

const DOC_SELECT = `
  id, doc_type, doc_number, status, supersedes_id,
  job_id, offer_id, invoice_id, customer_id, vehicle_id,
  locale, payload, pdf_path, pdf_sha256,
  issued_at, issued_by, sent_at,
  signed_at, signed_by_name, signature_path,
  cancelled_at, cancel_reason, gallery_consent,
  created_at, updated_at,
  customers(id, name, email, phone, address),
  vehicles(id, kenteken, make, model, year, colour, vin)
`;

export async function getRepairOrdersForJob(jobId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(DOC_SELECT)
    .eq('doc_type', 'repair_order')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getHandoverNotesForJob(jobId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(DOC_SELECT)
    .eq('doc_type', 'handover_note')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRepairOrder(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`${DOC_SELECT}, staff:issued_by(id, name)`)
    .eq('id', id)
    .eq('doc_type', 'repair_order')
    .single();

  if (error) throw error;
  return data;
}

export async function getHandoverNote(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`${DOC_SELECT}, staff:issued_by(id, name)`)
    .eq('id', id)
    .eq('doc_type', 'handover_note')
    .single();

  if (error) throw error;
  return data;
}

export async function getSignatures(documentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('signatures')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
