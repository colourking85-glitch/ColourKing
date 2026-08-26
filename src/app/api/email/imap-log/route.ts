import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;
  if (!supabaseUrl || !key) return null;
  // eslint-disable-next-line
  const { createClient: create } = require('@supabase/supabase-js');
  return create(supabaseUrl, key);
}

export async function GET() {
  const client = getSupabaseClient();

  let recentEmails: unknown[] = [];
  if (client) {
    const { data } = await client
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
