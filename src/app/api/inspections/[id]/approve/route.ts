import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Records an approval (signature) through the SQL function ins_approve()
 * (migration 0062). Only allowed while the inspection is TER_AKKOORD.
 *
 * Body: { role: 'inspecteur' | 'klant', signer_name, statement_text?,
 *         identification?, signature_path?, signer_email?, lock?: boolean }
 *
 * With lock=true and role=inspecteur the inspection is moved to AKKOORD
 * afterwards, which freezes the snapshot and locks it (VERGRENDELD).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      role: 'inspecteur' | 'klant';
      signer_name: string;
      statement_text?: string;
      identification?: string;
      signature_path?: string | null;
      signer_email?: string | null;
      lock?: boolean;
    };

    if (body.role !== 'inspecteur' && body.role !== 'klant') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!body.signer_name?.trim()) {
      return NextResponse.json({ error: 'signer_name required' }, { status: 400 });
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip');

    const { data: approval, error } = await supabase.rpc('ins_approve', {
      p_id: params.id,
      p_role: body.role,
      p_signer_name: body.signer_name.trim(),
      p_identification: body.identification ?? (body.role === 'inspecteur' ? 'staff_login' : 'name'),
      p_statement_text: body.statement_text ?? '',
      p_signature_path: body.signature_path ?? null,
      p_signer_email: body.signer_email ?? null,
      p_ip_address: ip ?? null,
      p_user_agent: req.headers.get('user-agent') ?? null,
    });
    if (error) throw error;

    let inspection = null;
    if (body.lock && body.role === 'inspecteur') {
      const { data, error: trErr } = await supabase.rpc('ins_transition', {
        p_id: params.id,
        p_to: 'AKKOORD',
        p_payload: {},
      });
      if (trErr) throw trErr;
      inspection = data;
    }

    return NextResponse.json({ approval, inspection }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
