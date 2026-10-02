import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.DES_SUPPORT_API_KEY;
  const apiUrl = process.env.DES_SUPPORT_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Support API not configured' }, { status: 503 });
  }

  const body = await req.json();

  const response = await fetch(`${apiUrl}/cases`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: body.subject,
      description: body.description,
      category: body.category || 'other',
      priority: body.priority || 'normal',
      requester: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        external_id: user.id,
      },
      context: {
        app: 'colourking-admin',
        app_version: process.env.NEXT_PUBLIC_APP_VERSION,
        route: body.route,
        browser: body.browser,
        os: body.os,
        environment: process.env.NODE_ENV,
        locale: body.locale,
        entity_refs: body.entity_refs,
      },
      correlation_id: body.correlation_id,
      idempotency_key: body.idempotency_key,
    }),
  });

  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
