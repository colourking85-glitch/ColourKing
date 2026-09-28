import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { ensureStoredPdf } from '@/modules/inspectie/pdf-render';
import { errorMessage } from '@/modules/inspectie/errors';
import type { InspectionReportData } from '@/modules/inspectie/template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INSPECTION_SELECT = `
  id, reference, status, purpose, licence_plate, vin, make, model, first_reg_date, fuel,
  odometer_km, rdw_verified, event_date, event_description, insurer_name, claim_number,
  finding_count, photo_count, total_hours, indicative_total_cents, started_at, locked_at, created_at,
  staff:inspector_id(name), customers(name),
  ins_findings(id, reference, sequence_no, component_key, hotspot_point, sub_location, damage_types, severity,
    origin, disposition, repair_hours, repair_technique, paint_required, paint_operation, paint_hours,
    blend_components, hidden_damage_possible, hidden_damage_note, adas_possible, description, created_at, updated_at,
    ins_finding_parts(id, description, part_number, qty, unit_price_cents, source)),
  ins_photos(id, reference, sequence_no, finding_id, shot_key, kind, storage_path, mime_type, bytes, sha256, captured_at, caption),
  ins_approvals(id, role, signer_name, signer_user_id, identification, statement_text, signature_path, document_hash, signed_at),
  ins_snapshots(id, snapshot_hash, pdf_path, pdf_hash, created_at)
`;

/**
 * Customer download of the final report through the share token.
 * Only available once the inspection is locked; the token may already be used.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const admin = createServiceClient();
  const tokenHash = createHash('sha256').update(params.token).digest('hex');

  try {
    const { data: tok } = await admin
      .from('ins_share_tokens')
      .select('inspection_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single();
    if (!tok || tok.revoked_at) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (new Date(tok.expires_at) < new Date()) return NextResponse.json({ error: 'Link expired' }, { status: 410 });

    const { data, error } = await admin
      .from('ins_inspections')
      .select(INSPECTION_SELECT)
      .eq('id', tok.inspection_id)
      .is('deleted_at', null)
      .single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const raw = data as unknown as InspectionReportData & { id: string; ins_snapshots: unknown };
    const snaps = raw.ins_snapshots;
    const report = { ...raw, ins_snapshots: Array.isArray(snaps) ? snaps : snaps ? [snaps] : [] } as InspectionReportData & { id: string };
    if (report.status !== 'VERGRENDELD') {
      return NextResponse.json({ error: 'Report not final yet' }, { status: 423 });
    }

    const pdf = await ensureStoredPdf(admin, report);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.reference}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
