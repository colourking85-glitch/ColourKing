'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { RepairOrderPayloadSchema, HandoverPayloadSchema } from './schema';
import type { RepairOrderPayload, HandoverPayload } from './schema';

export async function createRepairOrder(jobId: string) {
  const supabase = createClient();

  // Fetch job with related customer, vehicle, and approved offer
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, customer_id, vehicle_id')
    .eq('id', jobId)
    .single();

  if (jobErr) throw jobErr;

  // Fetch customer
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('id, name, email, phone, address')
    .eq('id', job.customer_id)
    .single();

  if (custErr) throw custErr;

  // Fetch vehicle
  let vehicle = null;
  if (job.vehicle_id) {
    const { data: v, error: vErr } = await supabase
      .from('vehicles')
      .select('id, kenteken, make, model, year, colour, vin')
      .eq('id', job.vehicle_id)
      .single();

    if (vErr) throw vErr;
    vehicle = v;
  }

  // Fetch approved offer for work description and total
  const { data: offers } = await supabase
    .from('offers')
    .select('id, total_cents, offer_lines(description)')
    .eq('job_id', jobId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  const offer = offers?.[0];
  const workLines = offer?.offer_lines?.map(
    (l: { description: string }) => l.description
  ) ?? [];

  const payload: RepairOrderPayload = {
    kenteken: vehicle?.kenteken ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? null,
    colour: vehicle?.colour ?? null,
    vin: vehicle?.vin ?? null,
    mileage_in: null,
    existing_damage: '',
    work_description: workLines.join('\n'),
    estimated_total_cents: offer?.total_cents ?? 0,
    terms_accepted: false,
    customer_name: customer.name,
    customer_address: customer.address ?? null,
    customer_phone: customer.phone ?? null,
    customer_email: customer.email ?? null,
  };

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      doc_type: 'repair_order',
      status: 'draft',
      job_id: jobId,
      customer_id: customer.id,
      vehicle_id: job.vehicle_id,
      locale: 'nl',
      payload,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/documenten');
  return doc;
}

export async function createHandoverNote(jobId: string) {
  const supabase = createClient();

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, customer_id, vehicle_id')
    .eq('id', jobId)
    .single();

  if (jobErr) throw jobErr;

  // Fetch approved offer for work summary
  const { data: offers } = await supabase
    .from('offers')
    .select('id, offer_lines(description)')
    .eq('job_id', jobId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  const offer = offers?.[0];
  const workLines = offer?.offer_lines?.map(
    (l: { description: string }) => l.description
  ) ?? [];

  const payload: HandoverPayload = {
    work_summary: workLines.join('\n'),
    mileage_out: 0,
    warranty_text: '',
    gallery_consent: false,
    items_returned: ['Sleutels', 'Kentekenbewijs'],
  };

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      doc_type: 'handover_note',
      status: 'draft',
      job_id: jobId,
      customer_id: job.customer_id,
      vehicle_id: job.vehicle_id,
      locale: 'nl',
      payload,
      gallery_consent: false,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/documenten');
  return doc;
}

export async function addSignature(
  documentId: string,
  signerName: string,
  signerRole: string,
  signatureData: string,
  ipAddress?: string
) {
  const supabase = createClient();

  // Verify document exists and is issued or draft
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, status')
    .eq('id', documentId)
    .single();

  if (docErr) throw docErr;

  if (doc.status === 'cancelled') {
    throw new Error('Cannot sign a cancelled document');
  }

  // Insert signature
  const insertData: Record<string, unknown> = {
    document_id: documentId,
    signer_name: signerName,
    signer_role: signerRole,
    signature_data: signatureData,
  };
  if (ipAddress) insertData.ip_address = ipAddress;

  const { data: sig, error: sigErr } = await supabase
    .from('signatures')
    .insert(insertData)
    .select()
    .single();

  if (sigErr) throw sigErr;

  // Update document signed_at / signed_by_name
  const { error: updateErr } = await supabase
    .from('documents')
    .update({
      signed_at: new Date().toISOString(),
      signed_by_name: signerName,
    })
    .eq('id', documentId);

  if (updateErr) throw updateErr;

  revalidatePath(`/app/reparatieopdracht/${documentId}`);
  revalidatePath(`/app/afleverbon/${documentId}`);
  return sig;
}

export async function setGalleryConsent(documentId: string, consent: boolean) {
  const supabase = createClient();

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, doc_type, status')
    .eq('id', documentId)
    .single();

  if (docErr) throw docErr;

  if (doc.status !== 'draft') {
    throw new Error('Gallery consent can only be set on draft documents');
  }

  const { data: updated, error } = await supabase
    .from('documents')
    .update({ gallery_consent: consent })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/app/afleverbon/${documentId}`);
  return updated;
}
