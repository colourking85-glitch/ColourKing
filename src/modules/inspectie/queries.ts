import { createClient } from '@/lib/supabase/server';
import type { InsStatus } from './machine';

const INSPECTION_SELECT = `
  id, reference, status, purpose,
  vehicle_id, customer_id, job_id, parent_inspection_id,
  licence_plate, vin, make, model, first_reg_date, fuel,
  odometer_km, rdw_verified,
  event_date, event_description, insurer_name, claim_number,
  finding_count, photo_count, total_hours, indicative_total_cents,
  inspector_id, started_at, submitted_at, locked_at,
  created_at, updated_at, created_by,
  vehicles(id, kenteken, make, model),
  customers(id, name, email),
  staff:inspector_id(id, name)
`;

export async function getInspections(filters?: {
  status?: InsStatus;
  vehicle_id?: string;
  customer_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('ins_inspections')
    .select(INSPECTION_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.search) {
    query = query.or(
      `reference.ilike.%${filters.search}%,licence_plate.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getInspection(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ins_inspections')
    .select(`
      ${INSPECTION_SELECT},
      ins_findings(
        id, reference, sequence_no, component_key,
        hotspot_point, sub_location, damage_types, severity,
        origin, disposition,
        repair_hours, repair_technique,
        paint_required, paint_operation, paint_hours,
        blend_components,
        hidden_damage_possible, hidden_damage_note,
        adas_possible, description,
        created_at, updated_at,
        ins_finding_parts(
          id, description, part_number, qty,
          unit_price_cents, source
        )
      ),
      ins_photos(
        id, reference, sequence_no, finding_id,
        shot_key, kind, storage_path, mime_type, bytes,
        sha256, captured_at, caption
      ),
      ins_approvals(
        id, role, signer_name, signer_user_id,
        identification, statement_text, signature_path,
        document_hash, signed_at
      ),
      ins_snapshots(
        id, snapshot_hash, pdf_path, pdf_hash, created_at
      ),
      ins_events(
        id, event_type, actor_id, payload, created_at
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  if (data.ins_findings) {
    data.ins_findings.sort((a: { sequence_no: number }, b: { sequence_no: number }) =>
      a.sequence_no - b.sequence_no
    );
  }
  if (data.ins_photos) {
    data.ins_photos.sort((a: { sequence_no: number }, b: { sequence_no: number }) =>
      a.sequence_no - b.sequence_no
    );
  }
  if (data.ins_events) {
    data.ins_events.sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  return data;
}

export async function getComponents() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ins_components')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getDamageTypes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ins_damage_types')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getInspectionsByVehicle(vehicleId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ins_inspections')
    .select('id, reference, status, purpose, finding_count, total_hours, indicative_total_cents, created_at')
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
