import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { message, to } = await req.json();

  if (!message?.trim() || !to) {
    return NextResponse.json({ error: 'Message and recipient required' }, { status: 400 });
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('id, contact_name, contact_email')
    .eq('id', params.id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // TODO: integrate with actual email service (SMTP / Resend / etc.)
  // For now, log the reply and store as a note
  console.log(`[Lead Reply] To: ${to}, Lead: ${params.id}, Message: ${message}`);

  return NextResponse.json({ ok: true, message: 'Reply queued' });
}
