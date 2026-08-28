import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'ai')
      .single();

    const aiSettings = data?.value as Record<string, unknown> | null;
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    return NextResponse.json({
      photo_check_enabled: hasApiKey && (aiSettings?.photo_check_enabled !== false),
    });
  } catch {
    return NextResponse.json({ photo_check_enabled: false });
  }
}
