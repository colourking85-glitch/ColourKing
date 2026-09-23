/**
 * Project portfolio (PF) — server-side data access and actions.
 * Staff routes pass the request's session client (RLS: office/admin);
 * storage writes go through the service-role client (never under app/(public)).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase/admin';
import {
  PORTFOLIO_BUCKET,
  categoryFromJobType,
  handlingFromPayerType,
  workItemsFromDescriptions,
  workingDaysBetween,
  suggestTitles,
  publishChecklist,
  type ChecklistItem,
} from './constants';
import type { PortfolioProjectInput, PortfolioPhotoMeta, RedactionRegion } from './schema';

// Generated types don't cover every join shape used here
type Db = SupabaseClient<any>;

const PROJECT_FIELDS =
  '*, vehicle_brands(id, name), vehicle_models(id, name), jobs(id, number, stage)';

export function photoUrl(path: string): string {
  return admin.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listProjects(db: Db) {
  const { data, error } = await db
    .from('portfolio_projects')
    .select(`${PROJECT_FIELDS}, portfolio_photos(id, storage_path, is_cover, phase, sort_order)`)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(p => {
    const photos = (p.portfolio_photos ?? []) as { storage_path: string; is_cover: boolean; phase: string; sort_order: number }[];
    const cover = photos.find(ph => ph.is_cover) ?? photos.find(ph => ph.phase === 'after') ?? photos[0];
    return { ...p, photo_count: photos.length, cover_url: cover ? photoUrl(cover.storage_path) : null, portfolio_photos: undefined };
  });
}

export async function getProject(db: Db, id: string) {
  const { data: project, error } = await db
    .from('portfolio_projects')
    .select(PROJECT_FIELDS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!project) return null;

  const { data: photos } = await db
    .from('portfolio_photos')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  // Work order photos still available to import (not yet imported)
  let jobPhotos: { id: string; phase: string; url: string; caption: string | null }[] = [];
  if (project.job_id) {
    const imported = new Set((photos ?? []).map(p => p.source_job_photo_id).filter(Boolean));
    const { data: jp } = await db
      .from('job_photos')
      .select('id, phase, storage_path, caption')
      .eq('job_id', project.job_id)
      .order('created_at', { ascending: true });
    jobPhotos = (jp ?? [])
      .filter(p => !imported.has(p.id))
      .map(p => ({
        id: p.id,
        phase: p.phase,
        caption: p.caption,
        url: admin.storage.from('job-photos').getPublicUrl(p.storage_path).data.publicUrl,
      }));
  }

  const photoList = (photos ?? []).map(p => ({ ...p, url: photoUrl(p.storage_path) }));
  return {
    ...project,
    photos: photoList,
    job_photos_available: jobPhotos,
    checklist: publishChecklist({ ...project, photos: photoList }),
  };
}

export async function createProject(db: Db, input: PortfolioProjectInput, userId: string | null) {
  const { data, error } = await db
    .from('portfolio_projects')
    .insert({ ...input, title_nl: input.title_nl ?? '', source: 'manual', created_by: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(db: Db, id: string, input: PortfolioProjectInput) {
  const { error } = await db.from('portfolio_projects').update(input).eq('id', id).is('deleted_at', null);
  if (error) throw error;
}

export async function softDeleteProject(db: Db, id: string) {
  const { error } = await db
    .from('portfolio_projects')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}

export type PublishResult =
  | { ok: true; dossier_number: string }
  | { ok: false; checklist: Record<ChecklistItem, boolean> };

/** Publish: checklist gate, then allocate the dossier number (once) and go live. */
export async function publishProject(db: Db, id: string): Promise<PublishResult> {
  const project = await getProject(db, id);
  if (!project) throw new Error('Not found');
  if (!Object.values(project.checklist).every(Boolean)) {
    return { ok: false, checklist: project.checklist };
  }
  const { data: number, error: rpcError } = await db.rpc('portfolio_assign_dossier_number', { p_project_id: id });
  if (rpcError) throw rpcError;

  const { error } = await db
    .from('portfolio_projects')
    .update({ status: 'published', published_at: project.published_at ?? new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return { ok: true, dossier_number: number as string };
}

export async function setStatus(db: Db, id: string, status: 'draft' | 'archived') {
  const { error } = await db.from('portfolio_projects').update({ status }).eq('id', id);
  if (error) throw error;
}

// ── Photos ──────────────────────────────────────────────────────────────────

export async function addPhoto(
  db: Db,
  projectId: string,
  file: { bytes: ArrayBuffer; type: 'image/jpeg' | 'image/webp'; width: number; height: number },
  meta: PortfolioPhotoMeta & { regions: RedactionRegion[]; sourceJobPhotoId?: string | null },
  confirmedBy: string,
) {
  const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, file.bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await db
    .from('portfolio_photos')
    .insert({
      project_id: projectId,
      phase: meta.phase,
      pair_group: meta.pair_group ?? null,
      is_cover: meta.is_cover ?? false,
      sort_order: meta.sort_order ?? 0,
      alt_nl: meta.alt_nl ?? null,
      alt_en: meta.alt_en ?? null,
      alt_tr: meta.alt_tr ?? null,
      storage_path: path,
      width: file.width,
      height: file.height,
      source_job_photo_id: meta.sourceJobPhotoId ?? null,
      redaction_regions: meta.regions,
      redaction_confirmed_by: confirmedBy,
      redaction_confirmed_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) {
    await admin.storage.from(PORTFOLIO_BUCKET).remove([path]);
    throw error;
  }
  if (meta.is_cover) await clearOtherCovers(db, projectId, data.id);
  return { ...data, url: photoUrl(path) };
}

async function clearOtherCovers(db: Db, projectId: string, keepId: string) {
  await db.from('portfolio_photos').update({ is_cover: false }).eq('project_id', projectId).neq('id', keepId);
}

export async function updatePhoto(db: Db, projectId: string, photoId: string, meta: Partial<PortfolioPhotoMeta>) {
  const { error } = await db.from('portfolio_photos').update(meta).eq('id', photoId).eq('project_id', projectId);
  if (error) throw error;
  if (meta.is_cover) await clearOtherCovers(db, projectId, photoId);
}

export async function deletePhoto(db: Db, projectId: string, photoId: string) {
  const { data } = await db
    .from('portfolio_photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (!data) return;
  await db.from('portfolio_photos').delete().eq('id', photoId);
  await admin.storage.from(PORTFOLIO_BUCKET).remove([data.storage_path]);
}

// ── Work order → dossier conversion (JB10, admin only) ──────────────────────

export type ConvertResult =
  | { ok: true; id: string; dossier_number: string }
  | { ok: false; status: number; error: string; existingId?: string };

export async function getDossierForJob(db: Db, jobId: string) {
  const { data } = await db
    .from('portfolio_projects')
    .select('id, dossier_number, status')
    .eq('job_id', jobId)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

/**
 * Create a draft dossier from a completed work order and allocate its number
 * immediately. Copies vehicle / category / handling / duration / work items /
 * consent — never customer details, plate, VIN, prices or notes.
 */
export async function convertJobToProject(db: Db, jobId: string, userId: string): Promise<ConvertResult> {
  const { data: job } = await db
    .from('jobs')
    .select('id, number, stage, job_type, payer_type, created_at, closed_at, updated_at, vehicle_id')
    .eq('id', jobId)
    .maybeSingle();
  if (!job) return { ok: false, status: 404, error: 'Work order not found' };
  if (!['delivered', 'closed'].includes(job.stage)) {
    return { ok: false, status: 409, error: 'Work order is not completed (delivered/closed)' };
  }

  const existing = await getDossierForJob(db, jobId);
  if (existing) return { ok: false, status: 409, error: 'Already converted', existingId: existing.id };

  // Vehicle → brand/model (matched to the managed lists, else free text)
  let brandId: string | null = null;
  let modelId: string | null = null;
  let modelFree: string | null = null;
  let vehicleLabel = '';
  let buildYear: number | null = null;
  let colour: string | null = null;
  let paintCode: string | null = null;
  if (job.vehicle_id) {
    const { data: v } = await db
      .from('vehicles')
      .select('make, merk, model, year, bouwjaar, colour, kleur, paint_code')
      .eq('id', job.vehicle_id)
      .maybeSingle();
    const make = (v?.make ?? v?.merk ?? '').trim();
    const model = (v?.model ?? '').trim();
    buildYear = v?.year ?? v?.bouwjaar ?? null;
    colour = v?.colour ?? v?.kleur ?? null;
    paintCode = v?.paint_code ?? null;
    vehicleLabel = [make, model].filter(Boolean).join(' ');
    if (make) {
      const { data: b } = await db.from('vehicle_brands').select('id').ilike('name', make).limit(1).maybeSingle();
      brandId = b?.id ?? null;
      if (brandId && model) {
        const { data: m } = await db
          .from('vehicle_models')
          .select('id')
          .eq('brand_id', brandId)
          .ilike('name', model)
          .limit(1)
          .maybeSingle();
        modelId = m?.id ?? null;
      }
    }
    if (!modelId) modelFree = vehicleLabel || null;
  }

  // Duration: first check-in → delivery, falling back to created → closed/updated
  const { data: events } = await db
    .from('job_events')
    .select('to_stage, created_at')
    .eq('job_id', jobId)
    .eq('event_type', 'stage_change')
    .order('created_at', { ascending: true });
  const checkIn = events?.find(e => e.to_stage === 'checked_in')?.created_at ?? job.created_at;
  const delivered = events?.find(e => e.to_stage === 'delivered')?.created_at ?? job.closed_at ?? job.updated_at;

  // Work items from the approved offer lines
  const { data: offers } = await db
    .from('offers')
    .select('offer_lines(description)')
    .eq('job_id', jobId)
    .eq('status', 'approved');
  const descriptions = (offers ?? []).flatMap(o =>
    ((o.offer_lines ?? []) as { description: string }[]).map(l => l.description),
  );

  // Consent from the handover note
  const { data: handover } = await db
    .from('documents')
    .select('id, gallery_consent')
    .eq('job_id', jobId)
    .eq('doc_type', 'handover_note')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const category = categoryFromJobType(job.job_type);
  const titles = suggestTitles(category, vehicleLabel);

  const { data: created, error } = await db
    .from('portfolio_projects')
    .insert({
      source: 'work_order',
      job_id: jobId,
      converted_by: userId,
      converted_at: new Date().toISOString(),
      created_by: userId,
      category,
      title_nl: titles.nl,
      title_en: titles.en,
      title_tr: titles.tr,
      brand_id: brandId,
      model_id: modelId,
      model_free_text: modelFree,
      build_year: buildYear,
      colour_name: colour,
      paint_code: paintCode,
      handling: handlingFromPayerType(job.payer_type),
      duration_working_days: workingDaysBetween(checkIn, delivered),
      work_items: workItemsFromDescriptions(descriptions),
      consent_status: handover?.gallery_consent ? 'received' : 'pending',
      consent_document_id: handover?.gallery_consent ? handover.id : null,
    })
    .select('id')
    .single();

  if (error) {
    // Unique job_id: a parallel click already converted it
    if (error.code === '23505') {
      const again = await getDossierForJob(db, jobId);
      return { ok: false, status: 409, error: 'Already converted', existingId: again?.id };
    }
    throw error;
  }

  const { data: number, error: rpcError } = await db.rpc('portfolio_assign_dossier_number', {
    p_project_id: created.id,
  });
  if (rpcError) {
    await db.from('portfolio_projects').delete().eq('id', created.id);
    throw rpcError;
  }

  await db.from('job_events').insert({
    job_id: jobId,
    event_type: 'note',
    actor_id: userId,
    note: `Omgezet naar projectdossier ${number}`,
    payload: { portfolio_project_id: created.id, dossier_number: number },
  });

  return { ok: true, id: created.id, dossier_number: number as string };
}
