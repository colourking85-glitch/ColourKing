import { createServiceClient } from '@/lib/supabase/server';
import { getInspection } from './queries';
import { ensureStoredPdf } from './pdf-render';
import type { InspectionReportData } from './template';

/**
 * Best-effort: once an inspection reaches VERGRENDELD, render the report and
 * freeze its hash on ins_snapshots. Failures are logged, never propagated, so
 * a rendering hiccup can't undo a lock. The download routes fall back to
 * rendering on demand.
 */
export async function freezePdfIfLocked(inspectionId: string, status: string | undefined): Promise<void> {
  if (status !== 'VERGRENDELD') return;
  try {
    const data = await getInspection(inspectionId) as unknown as InspectionReportData & { id: string };
    await ensureStoredPdf(createServiceClient(), data);
  } catch (err) {
    console.error('[ins] PDF freeze failed for', inspectionId, err instanceof Error ? err.message : err);
  }
}
