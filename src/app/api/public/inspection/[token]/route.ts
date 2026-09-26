import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { INS_PHOTO_BUCKET, signInsPhotoUrls } from '@/modules/inspectie/photos';
import { errorMessage } from '@/modules/inspectie/errors';

export const dynamic = 'force-dynamic';

/**
 * Public, token-gated view + customer signature for an inspection.
 * The token in the URL is hashed and validated inside the SQL functions
 * ins_share_view() / ins_approve_by_token() (migration 0066).
 */

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function statusFor(err: unknown): number {
  const m = errorMessage(err);
  if (m.includes('INS_SHARE_EXPIRED')) return 410;
  if (m.includes('INS_SHARE_USED')) return 409;
  if (m.includes('INS_SHARE_NOT_OPEN')) return 423;
  return 404;
}

type SharedPhoto = { id: string; reference: string; kind: string; finding_id: string | null; shot_key: string | null; storage_path: string; caption: string | null };

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase.rpc('ins_share_view', { p_token_hash: hashToken(params.token) });
    if (error) throw error;

    const view = data as Record<string, unknown> & { photos?: SharedPhoto[] };
    const signed = await signInsPhotoUrls(supabase, view.photos ?? []);
    // never expose storage paths to the public page
    const photos = signed.map(({ storage_path: _p, ...rest }) => rest);

    return NextResponse.json({ ...view, photos });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: statusFor(err) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();
  const tokenHash = hashToken(params.token);

  try {
    const body = await req.json() as {
      signer_name?: string;
      signer_email?: string | null;
      signature_data?: string;
      statement_text?: string;
    };
    if (!body.signer_name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const match = body.signature_data?.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Signature required' }, { status: 400 });
    }
    const png = Buffer.from(match[1], 'base64');
    if (png.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Signature too large' }, { status: 400 });
    }

    // Resolve the inspection (validates token, expiry, revocation)
    const { data: view, error: viewErr } = await supabase.rpc('ins_share_view', { p_token_hash: tokenHash });
    if (viewErr) throw viewErr;
    const inspectionId = (view as { id: string }).id;

    const storagePath = `${inspectionId}/signatures/klant-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from(INS_PHOTO_BUCKET)
      .upload(storagePath, png, { contentType: 'image/png', upsert: false });
    if (upErr) throw upErr;

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip');

    const { data: approval, error } = await supabase.rpc('ins_approve_by_token', {
      p_token_hash: tokenHash,
      p_signer_name: body.signer_name.trim(),
      p_signer_email: body.signer_email?.trim() || null,
      p_statement_text: body.statement_text ?? '',
      p_signature_path: storagePath,
      p_ip_address: ip ?? null,
      p_user_agent: req.headers.get('user-agent') ?? null,
    });
    if (error) {
      await supabase.storage.from(INS_PHOTO_BUCKET).remove([storagePath]);
      throw error;
    }

    const a = approval as { id: string; signer_name: string; signed_at: string };
    return NextResponse.json({ ok: true, approval: { id: a.id, signer_name: a.signer_name, signed_at: a.signed_at } }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: statusFor(err) });
  }
}
