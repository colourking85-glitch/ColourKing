import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'ai')
      .single();

    return NextResponse.json(data?.value ?? {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const value: Record<string, unknown> = {};
    if (typeof body.default_provider === 'string') value.default_provider = body.default_provider;
    if (typeof body.photo_check_enabled === 'boolean') value.photo_check_enabled = body.photo_check_enabled;
    if (typeof body.photo_check_provider === 'string') value.photo_check_provider = body.photo_check_provider;

    const { data: existing } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'ai')
      .single();

    const merged = { ...(existing?.value as Record<string, unknown> ?? {}), ...value };

    const { error } = await admin
      .from('settings')
      .upsert({ key: 'ai', value: merged }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, value: merged });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
