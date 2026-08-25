import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? '0.0.0';

  try {
    const supabase = createClient();
    // Simple connectivity check — fetch a single settings row
    const { error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'error', timestamp, version, detail: 'Database unreachable' },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: 'ok', timestamp, version });
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp, version, detail: 'Database unreachable' },
      { status: 503 }
    );
  }
}
