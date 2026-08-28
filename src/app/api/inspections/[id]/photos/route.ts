import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

const BUCKET = 'ins-photos';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ins_photos')
    .select('*')
    .eq('inspection_id', params.id)
    .order('sequence_no', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos = (data ?? []).map(p => ({
    ...p,
    url: supabase.storage.from(BUCKET).getPublicUrl(p.storage_path).data.publicUrl,
  }));

  return NextResponse.json(photos);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // Verify inspection exists and is editable
  const { data: inspection, error: insErr } = await supabase
    .from('ins_inspections')
    .select('id, status, inspector_id')
    .eq('id', params.id)
    .single();

  if (insErr || !inspection) {
    return NextResponse.json({ error: 'Inspectie niet gevonden' }, { status: 404 });
  }

  if (['VERGRENDELD', 'GEANNULEERD'].includes(inspection.status)) {
    return NextResponse.json({ error: 'Inspectie is vergrendeld' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const kind = (formData.get('kind') as string) || 'schade';
  const findingId = formData.get('finding_id') as string | null;
  const shotKey = formData.get('shot_key') as string | null;
  const caption = formData.get('caption') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Ongeldig bestandstype. Gebruik JPG, PNG, WebP of HEIC.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Bestand is te groot (max 15 MB)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Compute sha256
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  // Get next sequence number
  const { count } = await supabase
    .from('ins_photos')
    .select('id', { count: 'exact', head: true })
    .eq('inspection_id', params.id);

  const seqNo = (count ?? 0) + 1;
  const reference = `F-${String(seqNo).padStart(2, '0')}`;

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${params.id}/${kind}/${Date.now()}_${reference}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const photoId = crypto.randomUUID();

  const { data: photo, error: dbError } = await supabase
    .from('ins_photos')
    .insert({
      id: photoId,
      inspection_id: params.id,
      reference,
      sequence_no: seqNo,
      finding_id: findingId || null,
      shot_key: shotKey || null,
      kind,
      storage_path: storagePath,
      mime_type: file.type,
      bytes: file.size,
      sha256,
      captured_at: new Date().toISOString(),
      captured_by: inspection.inspector_id,
      caption: caption || null,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Update photo count on inspection
  await supabase
    .from('ins_inspections')
    .update({ photo_count: seqNo })
    .eq('id', params.id);

  const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

  return NextResponse.json({ ...photo, url }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { photoId } = await req.json();

  // Verify inspection is editable
  const { data: inspection } = await supabase
    .from('ins_inspections')
    .select('status')
    .eq('id', params.id)
    .single();

  if (inspection && ['VERGRENDELD', 'GEANNULEERD'].includes(inspection.status)) {
    return NextResponse.json({ error: 'Inspectie is vergrendeld' }, { status: 400 });
  }

  const { data: photo } = await supabase
    .from('ins_photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('inspection_id', params.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);

  await supabase
    .from('ins_photos')
    .delete()
    .eq('id', photoId);

  return NextResponse.json({ ok: true });
}
