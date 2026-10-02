import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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
  const body = await req.json();

  const response = await fetch(
    `${apiUrl}/cases/${encodeURIComponent(number)}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: body.body,
        requester_email: user.email,
      }),
    }
  );

  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
