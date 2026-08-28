import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { canTransition, getGuard, type InsStatus } from '@/modules/inspectie/machine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const db = user ? supabase : createServiceClient();

    const { to } = await req.json() as { to: InsStatus };

    const { data: inspection, error: fetchErr } = await db
      .from('ins_inspections')
      .select('id, status, finding_count, photo_count')
      .eq('id', params.id)
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
      const { data: approvals } = await db
        .from('ins_approvals')
        .select('id')
        .eq('inspection_id', params.id)
        .eq('role', 'inspecteur');

      if (!approvals?.length) {
        throw new Error('Inspecteur akkoord is vereist');
      }
    }

    const updates: Record<string, unknown> = { status: to };
    if (to === 'TER_AKKOORD') updates.submitted_at = new Date().toISOString();
    if (to === 'VERGRENDELD') updates.locked_at = new Date().toISOString();

    const { data: updated, error } = await db
      .from('ins_inspections')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    await db.from('ins_events').insert({
      inspection_id: params.id,
      event_type: `status_${to.toLowerCase()}`,
      actor_id: user?.id ?? null,
      payload: { from, to },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
