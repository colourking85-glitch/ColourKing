import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  // eslint-disable-next-line
  const { createClient: create } = require('@supabase/supabase-js');
  return create(supabaseUrl, serviceKey);
}

async function getImapFlow() {
  // eslint-disable-next-line
  const { ImapFlow } = require('imapflow');
  return ImapFlow;
}

async function getMailParser() {
  // eslint-disable-next-line
  const { simpleParser } = require('mailparser');
  return simpleParser;
}

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get('x-poll-secret') ??
    new URL(req.url).searchParams.get('secret');

  if (secret !== process.env.IMAP_POLL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Set it in Vercel env vars (Supabase Dashboard → Settings → API → service_role secret).', logs: [] },
      { status: 500 }
    );
  }

  const imapHost = process.env.IMAP_HOST || 'imappro.zoho.eu';
  const imapPort = parseInt(process.env.IMAP_PORT || '993');
  const imapUser = process.env.IMAP_USER || '';
  const imapPass = process.env.IMAP_PASS || '';

  if (!imapUser || !imapPass) {
    return NextResponse.json({ error: 'IMAP credentials not configured' }, { status: 500 });
  }

  const ImapFlow = await getImapFlow();
  const simpleParser = await getMailParser();

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: imapUser, pass: imapPass },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
  });

  let processed = 0;
  let skippedDedup = 0;
  const logs: string[] = [];

  function log(msg: string) {
    const line = `[imap-poll] ${new Date().toISOString()} ${msg}`;
    logs.push(line);
  }

  try {
    log(`Connecting to ${imapHost}:${imapPort} as ${imapUser}...`);
    await client.connect();
    log('Connected and authenticated');

    await client.mailboxOpen('INBOX');
    log('INBOX opened');

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const uids = await client.search({ since }, { uid: true });
    log(`Emails in last 48h: ${uids.length}`);

    const batch = (uids || []).slice(0, 50);
    if (!batch.length) {
      log('Nothing to process');
      return NextResponse.json({ ok: true, processed: 0, skippedDedup: 0, logs });
    }

    const toProcess: Array<{
      numericId: string;
      entityType: string;
      subject: string;
      fromAddress: string;
      receivedAt: string;
      messageId: string | null;
      snippet: string;
    }> = [];

    for await (const msg of client.fetch(batch, { envelope: true, source: true }, { uid: true })) {
      const parsed = await simpleParser(msg.source);
      const subject = parsed.subject || '';
      const from = (parsed.from?.text || '').toLowerCase();
      const fromAddress =
        parsed.from?.value?.[0]?.address || from;
      const receivedAt = parsed.date
        ? parsed.date.toISOString()
        : new Date().toISOString();
      const messageId = parsed.messageId || null;

      if (from.includes('colourking.nl')) continue;

      // Match [JB-1234], [LD-5678], [#1234], or [1234]
      const match = subject.match(/\[(?:(JB|LD|FA|ES)-)?#?(\d{1,10})\]/i);
      if (!match) continue;

      const prefix = (match[1] || '').toUpperCase();
      let entityType = 'lead';
      if (prefix === 'JB') entityType = 'job';
      else if (prefix === 'FA') entityType = 'invoice';
      else if (prefix === 'ES') entityType = 'offer';

      toProcess.push({
        numericId: match[2],
        entityType,
        subject,
        fromAddress,
        receivedAt,
        messageId,
        snippet: (parsed.text || '').trim().slice(0, 2000),
      });
    }

    log(`Candidates after filter: ${toProcess.length}`);

    for (const item of toProcess) {
      if (item.messageId) {
        const { data: existing } = await admin
          .from('email_log')
          .select('id')
          .eq('message_id', item.messageId)
          .limit(1);

        if (existing && existing.length > 0) {
          log(`SKIP (dedup) message_id=${item.messageId}`);
          skippedDedup++;
          continue;
        }
      }

      // Try to find entity by internal numbering
      let entityId: string | null = null;
      const tableMap: Record<string, string> = {
        lead: 'leads',
        job: 'jobs',
        invoice: 'invoices',
        offer: 'offers',
      };
      const table = tableMap[item.entityType];
      if (table) {
        const { data: match } = await admin
          .from(table)
          .select('id')
          .eq('number', parseInt(item.numericId))
          .limit(1);

        if (match && match.length > 0) {
          entityId = match[0].id;
        }
      }

      if (!entityId) {
        log(`No ${item.entityType} found for [${item.numericId}] subject="${item.subject}"`);
        continue;
      }

      await admin.from('email_log').insert({
        entity_type: item.entityType,
        entity_id: entityId,
        from_email: item.fromAddress,
        subject: item.subject,
        snippet: item.snippet,
        message_id: item.messageId,
        received_at: item.receivedAt,
      });

      log(`Processed: ${item.fromAddress} => ${item.entityType} ${entityId} [${item.numericId}]`);
      processed++;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.split('\n').slice(0, 3).join(' | ') : '';
    if (message.includes('Command failed') || message.includes('LOGIN')) {
      log(`ERROR: Authentication failed — check IMAP_PASS is a Zoho App Password (not account password). Detail: ${message}`);
    } else if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND') || message.includes('timeout')) {
      log(`ERROR: Connection failed to ${imapHost}:${imapPort} — check IMAP_HOST and IMAP_PORT. Detail: ${message}`);
    } else {
      log(`ERROR: ${message}${stack ? ` | ${stack}` : ''}`);
    }
    return NextResponse.json(
      { ok: false, error: message, processed, skippedDedup, logs },
      { status: 500 }
    );
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }

  log(`Done. Processed: ${processed} | Dedup-skipped: ${skippedDedup}`);
  return NextResponse.json({ ok: true, processed, skippedDedup, logs, polledAt: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
