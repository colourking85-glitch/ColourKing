import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();

    const { data: doc, error } = await supabase
      .from('documents')
      .select(`
        id, doc_type, doc_number, status, locale, payload,
        gallery_consent, issued_at, signed_at, signed_by_name,
        share_token, share_expires_at,
        customers(id, name, email, phone),
        vehicles(id, kenteken, make, model)
      `)
      .eq('share_token', params.token)
      .eq('doc_type', 'handover_note')
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (doc.share_expires_at && new Date(doc.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    const { data: signatures } = await supabase
      .from('signatures')
      .select('id, signer_name, signer_role, signature_data, created_at')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ ...doc, signatures: signatures ?? [] });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, status, share_token, share_expires_at')
      .eq('share_token', params.token)
      .eq('doc_type', 'handover_note')
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (doc.share_expires_at && new Date(doc.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    const body = await req.json();

    if (body.action === 'sign') {
      if (!body.signer_name || !body.signature_data) {
        return NextResponse.json({ error: 'Name and signature required' }, { status: 400 });
      }

      const { error: sigErr } = await supabase
        .from('signatures')
        .insert({
          document_id: doc.id,
          signer_name: body.signer_name,
          signer_role: 'customer',
          signature_data: body.signature_data,
        });

      if (sigErr) throw sigErr;

      await supabase
        .from('documents')
        .update({
          signed_at: new Date().toISOString(),
          signed_by_name: body.signer_name,
        })
        .eq('id', doc.id);

      return NextResponse.json({ ok: true });
    }

    if (body.action === 'gallery_consent') {
      const { error } = await supabase
        .from('documents')
        .update({ gallery_consent: body.consent })
        .eq('id', doc.id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
