import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';

const BUCKET = 'lead-photos';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB total

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const leadId = formData.get('lead_id') as string | null;

  if (!leadId) {
    return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
  }

  const { data: lead } = await admin
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const files: File[] = [];
  for (const entry of formData.getAll('files')) {
    if (entry instanceof File) files.push(entry);
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
  }

  let totalSize = 0;
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.name}` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large: ${file.name} (max 5 MB)` }, { status: 400 });
    }
    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json({ error: 'Total upload size exceeds 20 MB' }, { status: 400 });
  }

  const uploaded = [];
  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const storagePath = `${leadId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) continue;

    const { data: photo } = await admin
      .from('lead_photos')
      .insert({ lead_id: leadId, storage_path: storagePath })
      .select()
      .single();

    if (photo) uploaded.push(photo);
  }

  return NextResponse.json({ uploaded: uploaded.length }, { status: 201 });
}
