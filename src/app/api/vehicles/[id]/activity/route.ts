import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Everything that hangs off a vehicle, for the VH10 hub view.
 * No new tables: every list below is an existing table filtered on vehicle_id.
 * The odometer is derived from the most recent reading across jobs and locked
 * inspections, never stored separately.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vehicleId = params.id;

  const [inspections, jobs, offers, invoices, appointments, leads, documents] = await Promise.all([
    supabase
      .from('ins_inspections')
      .select('id, reference, status, purpose, finding_count, photo_count, total_hours, odometer_km, submitted_at, locked_at, created_at, staff:inspector_id(id, name)')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, number, stage, intake_km, created_at, closed_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false }),
    supabase
      .from('offers')
      .select('id, offer_number, status, total_cents, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total_cents, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, type, status, scheduled_date, scheduled_time, created_at')
      .eq('vehicle_id', vehicleId)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('leads')
      .select('id, number, status, created_at')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    // Issued repair orders / handover notes freeze mileage_in / mileage_out in their payload.
    supabase
      .from('documents')
      .select('id, doc_type, doc_number, issued_at, payload')
      .eq('vehicle_id', vehicleId)
      .in('doc_type', ['repair_order', 'handover_note'])
      .not('issued_at', 'is', null)
      .order('issued_at', { ascending: false }),
  ]);

  const firstError = [inspections, jobs, offers, invoices, appointments, leads, documents].find(r => r.error)?.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  // Derived last-known odometer: latest of handover mileage_out, repair-order mileage_in,
  // job intake and locked inspection reading.
  type Reading = { km: number; at: string; source: 'job_out' | 'job_in' | 'inspection'; ref: string };
  const readings: Reading[] = [];
  for (const j of jobs.data ?? []) {
    if (j.intake_km) readings.push({ km: j.intake_km, at: j.created_at, source: 'job_in', ref: `#${j.number}` });
  }
  for (const d of documents.data ?? []) {
    const payload = (d.payload ?? {}) as { mileage_out?: number | null; mileage_in?: number | null };
    const km = d.doc_type === 'handover_note' ? payload.mileage_out : payload.mileage_in;
    if (km && d.issued_at) {
      readings.push({ km, at: d.issued_at, source: d.doc_type === 'handover_note' ? 'job_out' : 'job_in', ref: d.doc_number ?? '' });
    }
  }
  for (const i of inspections.data ?? []) {
    if (i.odometer_km && i.status === 'VERGRENDELD') {
      readings.push({ km: i.odometer_km, at: i.locked_at ?? i.created_at, source: 'inspection', ref: i.reference });
    }
  }
  readings.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const odometer = readings[0] ?? null;

  return NextResponse.json({
    inspections: inspections.data ?? [],
    jobs: jobs.data ?? [],
    offers: offers.data ?? [],
    invoices: invoices.data ?? [],
    appointments: appointments.data ?? [],
    leads: leads.data ?? [],
    odometer,
  });
}
