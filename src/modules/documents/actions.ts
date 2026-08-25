'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DocumentSchema, IssueDocumentSchema, CancelDocumentSchema } from './schema';

export async function createDocument(input: unknown) {
  const data = DocumentSchema.parse(input);
  const supabase = createClient();

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({ ...clean, status: 'draft' })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/documenten');
  return doc;
}

export async function issueDocument(input: unknown) {
  const { id, payload } = IssueDocumentSchema.parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('documents')
    .select('id, doc_type, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'draft') {
    throw new Error(`Document is ${existing.status}, can only issue from draft`);
  }

  const { data: numResult, error: numErr } = await supabase
    .rpc('allocate_number', { p_doc_type: existing.doc_type });

  if (numErr) throw numErr;
  const docNumber = numResult as string;

  const payloadJson = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payloadJson));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: doc, error: updateErr } = await supabase
    .from('documents')
    .update({
      doc_number: docNumber,
      status: 'issued',
      payload,
      pdf_sha256: sha256,
      issued_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw updateErr;

  revalidatePath('/app/documenten');
  revalidatePath(`/app/documenten/${id}`);
  return doc;
}

export async function cancelDocument(input: unknown) {
  const { id, cancel_reason } = CancelDocumentSchema.parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('documents')
    .select('id, doc_type, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status === 'cancelled') {
    throw new Error('Document is already cancelled');
  }

  if (existing.doc_type === 'invoice' && existing.status === 'issued') {
    throw new Error('Invoices cannot be directly cancelled — create a credit note instead');
  }

  const { data: doc, error: updateErr } = await supabase
    .from('documents')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw updateErr;

  revalidatePath('/app/documenten');
  revalidatePath(`/app/documenten/${id}`);
  return doc;
}

export async function deleteDocument(id: string) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('documents')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'draft') {
    throw new Error('Only draft documents can be deleted');
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/documenten');
}

export async function updateDocumentPayload(id: string, payload: Record<string, unknown>) {
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('documents')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  if (existing.status !== 'draft') {
    throw new Error('Only draft documents can be edited');
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .update({ payload })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/app/documenten/${id}`);
  return doc;
}
