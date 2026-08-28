import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const photoCheckEnabled = body.photo_check_enabled === true;

    const { error } = await admin
      .from('settings')
      .upsert({
        key: 'ai',
        value: { photo_check_enabled: photoCheckEnabled },
      }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
