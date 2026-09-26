import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { errorMessage } from '@/modules/inspectie/errors';
import { sendEmail } from '@/modules/email/sender';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://colourking.nl';
const LINK_DAYS = 14;

const sharePath = (token: string) => `/s/inspection/${token}`;

/** Existing share links for this inspection (no raw tokens, only metadata). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('ins_share_tokens')
    .select('id, recipient_email, expires_at, used_at, revoked_at, created_at')
    .eq('inspection_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/**
 * Creates a customer signing link. Body: { email?: string }.
 * Only while the inspection is TER_AKKOORD (the SQL function enforces the
 * same rule at signing time). Sends the link by email when an address is given.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string | null };
    const email = body.email?.trim() || null;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { data: ins, error: insErr } = await supabase
      .from('ins_inspections')
      .select('id, reference, status, licence_plate, make, model, customers(name, email)')
      .eq('id', params.id)
      .single();
    if (insErr || !ins) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    if (ins.status !== 'TER_AKKOORD') {
      return NextResponse.json({ error: 'Share link is only available while the inspection is pending approval' }, { status: 400 });
    }

    const token = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('ins_share_tokens')
      .insert({
        inspection_id: params.id,
        token_hash: tokenHash,
        recipient_email: email,
        expires_at: expiresAt,
        created_by: user.id,
      });
    if (error) throw error;

    const url = `${APP_URL}${sharePath(token)}`;

    let emailed = false;
    if (email) {
      const vehicle = [ins.make, ins.model].filter(Boolean).join(' ');
      const subject = `Schadeopname ${ins.reference} – graag uw akkoord`;
      const html = `
        <p>Beste ${escapeHtml((ins.customers as { name?: string } | null)?.name ?? 'klant')},</p>
        <p>De schadeopname <strong>${escapeHtml(ins.reference)}</strong> voor ${escapeHtml(vehicle)}
        (${escapeHtml(ins.licence_plate ?? '')}) staat klaar om te bekijken en te ondertekenen.</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none">Opname bekijken en ondertekenen</a></p>
        <p>Of open deze link: <a href="${url}">${url}</a><br/>
        De link is ${LINK_DAYS} dagen geldig.</p>
        <p>Met vriendelijke groet,<br/>ColourKing Autoschade</p>`;
      const result = await sendEmail(email, subject, html);
      emailed = !!result.success;
    }

    return NextResponse.json({ url, expires_at: expiresAt, emailed }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
