import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { INS_PHOTO_BUCKET, INS_SIGNED_URL_TTL, signInsPhotoUrls } from '@/modules/inspectie/photos';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('ins_photos')
    .select('*')
    .eq('inspection_id', params.id)
    .order('sequence_no', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos = await signInsPhotoUrls(supabase, data ?? []);
  return NextResponse.json(photos);
}

/**
 * Evidence photos are write-once (migration 0046): there is no DELETE.
 * Photos live in the private bucket `ins-originals` and are served via
 * short-lived signed URLs.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: inspection, error: insErr } = await supabase
    .from('ins_inspections')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (insErr || !inspection) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
  }
  if (!['CONCEPT', 'BEZIG'].includes(inspection.status)) {
    return NextResponse.json({ error: 'Inspection is locked' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const kind = (formData.get('kind') as string) || 'schade';
  const findingId = formData.get('finding_id') as string | null;
  const shotKey = formData.get('shot_key') as string | null;
  const caption = formData.get('caption') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP or HEIC.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 15 MB)' }, { status: 400 });
  }
  if (!['shot', 'schade', 'pre_existent', 'document'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid photo kind' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  const photoId = crypto.randomUUID();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `${params.id}/${photoId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(INS_PHOTO_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // reference + sequence_no are assigned by the ins_assign_reference trigger;
  // photo_count is maintained by the ins_photos_recount trigger.
  const { data: photo, error: dbError } = await supabase
    .from('ins_photos')
    .insert({
      id: photoId,
      inspection_id: params.id,
      reference: 'F-00',
      sequence_no: 0,
      finding_id: findingId || null,
      shot_key: shotKey || null,
      kind,
      storage_path: storagePath,
      mime_type: file.type,
      bytes: file.size,
      sha256,
      captured_at: new Date().toISOString(),
      captured_by: user.id,
      caption: caption || null,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(INS_PHOTO_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: signed } = await supabase.storage
    .from(INS_PHOTO_BUCKET)
    .createSignedUrl(storagePath, INS_SIGNED_URL_TTL);

  return NextResponse.json({ ...photo, url: signed?.signedUrl ?? null }, { status: 201 });
}
