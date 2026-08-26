import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  // eslint-disable-next-line
  const { createClient: create } = require('@supabase/supabase-js');
  return create(supabaseUrl, serviceKey);
}

export async function GET() {
  const admin = getAdminClient();

  let recentEmails: unknown[] = [];
  if (admin) {
    const { data } = await admin
      .from('email_log')
      .select('id, entity_type, entity_id, from_email, subject, snippet, received_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    recentEmails = data ?? [];
  }

  const imapConfig = {
    name: 'imap-inbox-poll',
    schedule: '*/5 * * * *',
    description: 'Every 5 minutes',
    inbox: process.env.IMAP_USER || 'info@colourking.nl',
    host: `${process.env.IMAP_HOST || 'imappro.zoho.eu'}:${process.env.IMAP_PORT || '993'}`,
  };

  return NextResponse.json({ recentEmails, imapConfig });
}
