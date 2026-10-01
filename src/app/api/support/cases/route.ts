import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const apiTarget = new URL(`${apiUrl}/cases`);
  const page = url.searchParams.get('page') || '1';
  const status = url.searchParams.get('status');

  apiTarget.searchParams.set('page', page);
  apiTarget.searchParams.set('per_page', '50');
  if (status) apiTarget.searchParams.set('status', status);

  const response = await fetch(apiTarget.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Support API error' }));
    return NextResponse.json(err, { status: response.status });
  }

  const result = await response.json();

  if (result.data) {
    result.data = result.data.filter(
      (c: { user_email: string }) => c.user_email === user.email
    );
  }

  return NextResponse.json(result);
}
