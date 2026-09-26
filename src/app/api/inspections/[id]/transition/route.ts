import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canTransition, type InsStatus } from '@/modules/inspectie/machine';

/**
 * Status changes go through the SQL function ins_transition() (migration 0062).
 * It re-validates the machine, recounts, checks guards, writes the audit event,
 * and on AKKOORD freezes a snapshot and locks the inspection.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { to, payload } = await req.json() as { to: InsStatus; payload?: Record<string, unknown> };

    const { data: current, error: fetchErr } = await supabase
      .from('ins_inspections')
      .select('status')
      .eq('id', params.id)
      .single();
    if (fetchErr) throw fetchErr;

    if (!canTransition(current.status as InsStatus, to)) {
      return NextResponse.json(
        { error: `Transition ${current.status} -> ${to} not allowed` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('ins_transition', {
      p_id: params.id,
      p_to: to,
      p_payload: payload ?? {},
    });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
