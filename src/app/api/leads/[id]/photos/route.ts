import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'lead-photos';
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
const MAX_FILES = 5;

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXTENSIONS.includes(ext);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lead_photos')
    .select('*')
    .eq('lead_id', params.id)
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

  const { count } = await supabase
    .from('lead_photos')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', params.id);

  if ((count ?? 0) >= MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} photos per lead` }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (!isImageFile(file)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG or WebP.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${params.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: photo, error: dbError } = await supabase
    .from('lead_photos')
    .insert({ lead_id: params.id, storage_path: storagePath })
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
    .from('lead_photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('lead_id', params.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  await supabase.from('lead_photos').delete().eq('id', photoId);

  return NextResponse.json({ ok: true });
}
