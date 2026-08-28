import { NextResponse } from 'next/server';
import { AI_PROVIDERS } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = Object.values(AI_PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    envKey: p.envKey,
    models: p.models,
    active: p.isConfigured(),
  }));

  return NextResponse.json({ providers });
}
