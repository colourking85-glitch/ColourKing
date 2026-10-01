import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
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

  const { number } = await params;

  const response = await fetch(`${apiUrl}/cases/${encodeURIComponent(number)}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Case not found' }));
    return NextResponse.json(err, { status: response.status });
  }

  const result = await response.json();
  return NextResponse.json(result);
}
