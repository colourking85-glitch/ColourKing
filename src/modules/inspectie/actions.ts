'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { InspectionSchema, FindingSchema, FindingPartSchema } from './schema';
import { canTransition, getGuard, type InsStatus } from './machine';

export async function createInspection(input: unknown) {
  const data = InspectionSchema.parse(input);
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v != null)
  );

  const { data: inspection, error } = await supabase
    .from('ins_inspections')
    .insert({
      ...clean,
      status: 'CONCEPT',
      inspector_id: user.id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/inspecties');
  return inspection;
}

export async function updateInspection(id: string, input: unknown) {
  const data = InspectionSchema.partial().parse(input);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('ins_inspections')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== 'CONCEPT' && existing.status !== 'BEZIG') {
    throw new Error('Alleen concept/bezig inspecties kunnen worden bewerkt');
  }

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: inspection, error } = await supabase
    .from('ins_inspections')
    .update(clean)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/app/inspecties');
  revalidatePath(`/app/inspecties/${id}`);
  return inspection;
}

export async function upsertFinding(input: unknown) {
  const data = FindingSchema.parse(input);
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: finding, error } = await supabase
    .from('ins_findings')
    .upsert({
      ...data,
      created_by: user.id,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  await recountInspection(data.inspection_id);
  revalidatePath(`/app/inspecties/${data.inspection_id}`);
  return finding;
}

export async function deleteFinding(id: string, inspectionId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('ins_findings')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recountInspection(inspectionId);
  revalidatePath(`/app/inspecties/${inspectionId}`);
}

export async function upsertFindingPart(input: unknown) {
  const data = FindingPartSchema.parse(input);
  const supabase = createClient();

  const { data: part, error } = await supabase
    .from('ins_finding_parts')
    .upsert(data)
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/app/inspecties/${data.inspection_id}`);
  return part;
}

export async function deleteFindingPart(id: string, inspectionId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('ins_finding_parts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath(`/app/inspecties/${inspectionId}`);
}

export async function transitionInspection(id: string, to: InsStatus) {
  const supabase = createClient();

  const { data: inspection, error: fetchErr } = await supabase
    .from('ins_inspections')
    .select('id, status, finding_count, photo_count')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const from = inspection.status as InsStatus;
  if (!canTransition(from, to)) {
    throw new Error(`Kan niet overgaan van ${from} naar ${to}`);
  }

  const guard = getGuard(from, to);
  if (guard === 'has_findings' && (!inspection.finding_count || inspection.finding_count === 0)) {
    throw new Error('Inspectie moet minstens één bevinding hebben');
  }
  if (guard === 'has_inspector_approval') {
    const { data: approvals } = await supabase
      .from('ins_approvals')
      .select('id')
      .eq('inspection_id', id)
      .eq('role', 'inspecteur');

    if (!approvals?.length) {
      throw new Error('Inspecteur akkoord is vereist');
    }
  }

  const updates: Record<string, unknown> = { status: to };
  if (to === 'TER_AKKOORD') {
    updates.submitted_at = new Date().toISOString();
  }
  if (to === 'VERGRENDELD') {
    updates.locked_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from('ins_inspections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('ins_events').insert({
    inspection_id: id,
    event_type: `status_${to.toLowerCase()}`,
    actor_id: user?.id,
    payload: { from, to },
  });

  revalidatePath('/app/inspecties');
  revalidatePath(`/app/inspecties/${id}`);
  return updated;
}

export async function cancelInspection(id: string) {
  return transitionInspection(id, 'GEANNULEERD');
}

async function recountInspection(inspectionId: string) {
  const supabase = createClient();

  const { data: findings } = await supabase
    .from('ins_findings')
    .select('repair_hours, paint_hours')
    .eq('inspection_id', inspectionId);

  const { count: photoCount } = await supabase
    .from('ins_photos')
    .select('id', { count: 'exact', head: true })
    .eq('inspection_id', inspectionId);

  const findingCount = findings?.length ?? 0;
  const totalHours = (findings ?? []).reduce(
    (sum, f) => sum + Number(f.repair_hours) + Number(f.paint_hours),
    0
  );

  await supabase
    .from('ins_inspections')
    .update({
      finding_count: findingCount,
      photo_count: photoCount ?? 0,
      total_hours: totalHours,
    })
    .eq('id', inspectionId);
}

export async function softDeleteInspection(id: string) {
  const supabase = createClient();

  const { data: inspection, error: fetchErr } = await supabase
    .from('ins_inspections')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;
  if (inspection.status === 'VERGRENDELD') {
    throw new Error('Vergrendelde inspecties kunnen niet worden verwijderd');
  }

  const { error } = await supabase
    .from('ins_inspections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/app/inspecties');
}
