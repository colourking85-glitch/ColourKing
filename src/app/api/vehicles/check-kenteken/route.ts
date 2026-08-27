import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const kenteken = req.nextUrl.searchParams.get('kenteken');

  if (!kenteken?.trim()) {
    return NextResponse.json({ exists: false });
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, kenteken, make, model, status')
    .eq('kenteken', kenteken.trim().toUpperCase())
    .is('deleted_at', null)
    .neq('status', 'archived');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    exists: (data?.length ?? 0) > 0,
    vehicles: data ?? [],
  });
}
