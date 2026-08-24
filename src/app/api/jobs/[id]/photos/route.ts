import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'job-photos';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', params.id)
    .order('created_at', { ascending: true });

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

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const phase = (formData.get('phase') as string) || 'before';
  const caption = formData.get('caption') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Ongeldig bestandstype. Gebruik JPG, PNG of WebP.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Bestand is te groot (max 10 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${params.id}/${phase}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: photo, error: dbError } = await supabase
    .from('job_photos')
    .insert({
      job_id: params.id,
      phase,
      storage_path: storagePath,
      caption: caption || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

  return NextResponse.json({ ...photo, url }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { photoId } = await req.json();

  const { data: photo } = await supabase
    .from('job_photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('job_id', params.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Foto niet gevonden' }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);

  await supabase
    .from('job_photos')
    .delete()
    .eq('id', photoId);

  return NextResponse.json({ ok: true });
}
