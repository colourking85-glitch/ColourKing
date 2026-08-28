import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getActiveProviders, getDefaultProvider, type AIProviderId } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'ai')
      .single();

    const aiSettings = data?.value as Record<string, unknown> | null;
    const active = getActiveProviders();
    const defaultProvider = getDefaultProvider(aiSettings?.default_provider as AIProviderId | null);

    return NextResponse.json({
      photo_check_enabled: active.length > 0 && aiSettings?.photo_check_enabled !== false,
      active_providers: active.map(p => p.id),
      default_provider: defaultProvider?.id ?? null,
      photo_check_provider: (aiSettings?.photo_check_provider as string) || defaultProvider?.id || null,
    });
  } catch {
    return NextResponse.json({
      photo_check_enabled: false,
      active_providers: [],
      default_provider: null,
      photo_check_provider: null,
    });
  }
}
