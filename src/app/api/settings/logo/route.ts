import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { invalidateCompanyCache } from '@/lib/company';

const BUCKET = 'company-assets';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    if (!['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const storagePath = `logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Remove old logos
    const { data: existing } = await admin.storage.from(BUCKET).list('', { limit: 20 });
    const oldLogos = (existing ?? []).filter(f => f.name.startsWith('logo.'));
    if (oldLogos.length > 0) {
      await admin.storage.from(BUCKET).remove(oldLogos.map(f => f.name));
    }

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    // Save logo URL in company settings
    const { data: settings } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'company')
      .single();

    const merged = { ...(settings?.value as Record<string, unknown> ?? {}), logo_url: urlData.publicUrl };

    await admin
      .from('settings')
      .upsert({ key: 'company', value: merged }, { onConflict: 'key' });

    invalidateCompanyCache();

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { data: existing } = await admin.storage.from(BUCKET).list('', { limit: 20 });
    const logos = (existing ?? []).filter(f => f.name.startsWith('logo.'));
    if (logos.length > 0) {
      await admin.storage.from(BUCKET).remove(logos.map(f => f.name));
    }

    const { data: settings } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'company')
      .single();

    if (settings?.value) {
      const val = settings.value as Record<string, unknown>;
      delete val.logo_url;
      await admin
        .from('settings')
        .upsert({ key: 'company', value: val }, { onConflict: 'key' });
    }

    invalidateCompanyCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
