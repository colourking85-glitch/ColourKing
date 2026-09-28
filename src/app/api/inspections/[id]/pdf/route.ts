import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getInspection } from '@/modules/inspectie/queries';
import { renderInspectionPdf, ensureStoredPdf } from '@/modules/inspectie/pdf-render';
import { errorMessage } from '@/modules/inspectie/errors';
import type { InspectionReportData } from '@/modules/inspectie/template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Report PDF (IN15). Locked inspections are rendered once and stored with
 * their hash on ins_snapshots; drafts are rendered on the fly with a CONCEPT
 * watermark. Staff only (RLS applies to the data read).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getInspection(params.id) as unknown as InspectionReportData & { id: string };
    const admin = createServiceClient();

    const pdf = data.status === 'VERGRENDELD'
      ? await ensureStoredPdf(admin, data)
      : await renderInspectionPdf(admin, data);

    const inline = req.nextUrl.searchParams.get('inline') === '1';
    const filename = `${data.reference}${data.status === 'VERGRENDELD' ? '' : '-concept'}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
