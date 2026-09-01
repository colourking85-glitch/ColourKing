import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_CERTIFICATIONS = {
  bovag: false,
  rdw_apk: false,
  erkend_leerbedrijf: false,
  erkend_duurzaam: false,
  paint_system: '',
  insurer_partners: '',
  google_review_score: '',
  google_review_count: 0,
  response_sla_hours: 0,
  show_replacement_vehicle: false,
  show_pickup_delivery: false,
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

export async function GET() {
  const client = getClient();
  if (!client) {
    // Dev fallback — return defaults
    return NextResponse.json({
      certifications: DEFAULT_CERTIFICATIONS,
    });
  }

  const { data } = await client
    .from('settings')
    .select('value')
    .eq('key', 'certifications')
    .single();

  return NextResponse.json({
    certifications: data?.value ?? DEFAULT_CERTIFICATIONS,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const certifications = body.certifications ?? body;

  const client = getClient();
  if (!client) {
    // Dev fallback — accept the update silently
    return NextResponse.json({ success: true, certifications });
  }

  const { error } = await client
    .from('settings')
    .upsert(
      { key: 'certifications', value: certifications },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, certifications });
}
