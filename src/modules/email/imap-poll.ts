/**
 * IMAP inbox poll — captures customer replies into email_log.
 *
 * Runs from the daily Vercel cron and on demand (lead page, monitor, SY25),
 * throttled through settings key 'email_poll_state' so opening screens does
 * not hammer Zoho.
 *
 * A message is linked to a lead/job/invoice/offer by, in order:
 *   1. subject tag  [LD-0018] / [JB-12] / [FA-3] / [ES-7] / [18]
 *   2. In-Reply-To / References matching an email we sent (email_log.message_id)
 *   3. sender address matching a recent lead's contact_email
 */

import { admin } from '@/lib/supabase/admin';
import { extractReply } from './lead-thread';

const POLL_STATE_KEY = 'email_poll_state';
const DEFAULT_MIN_INTERVAL_MS = 2 * 60 * 1000;
const LOOKBACK_MS = 48 * 60 * 60 * 1000;
const SENDER_MATCH_WINDOW_DAYS = 90;

export type PollResult = {
  ok: boolean;
  throttled?: boolean;
  processed: number;
  skippedDedup: number;
  logs: string[];
  polledAt: string | null;
  error?: string;
};

type PollState = { last_polled_at?: string; last_result?: Omit<PollResult, 'logs'> & { logs?: string[] } };

export async function getPollState(): Promise<PollState> {
  const { data } = await admin.from('settings').select('value').eq('key', POLL_STATE_KEY).maybeSingle();
  return (data?.value as PollState | undefined) ?? {};
}

async function savePollState(state: PollState) {
  await admin.from('settings').upsert({ key: POLL_STATE_KEY, value: state, updated_at: new Date().toISOString() });
}

const TABLES: Record<string, string> = { lead: 'leads', job: 'jobs', invoice: 'invoices', offer: 'offers' };

/**
 * Poll the inbox. With minIntervalMs > 0 the call is skipped (throttled)
 * when the previous poll is more recent than that.
 */
export async function pollInbox({ minIntervalMs = DEFAULT_MIN_INTERVAL_MS } = {}): Promise<PollResult> {
  const state = await getPollState();
  if (minIntervalMs > 0 && state.last_polled_at) {
    const age = Date.now() - new Date(state.last_polled_at).getTime();
    if (age < minIntervalMs) {
      return { ok: true, throttled: true, processed: 0, skippedDedup: 0, logs: [], polledAt: state.last_polled_at };
    }
  }

  // Claim the slot first so parallel callers don't poll twice
  const startedAt = new Date().toISOString();
  await savePollState({ ...state, last_polled_at: startedAt });

  const result = await runPoll();
  await savePollState({
    last_polled_at: startedAt,
    last_result: { ...result, logs: result.logs.slice(-20) },
  });
  return result;
}

async function runPoll(): Promise<PollResult> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(`[imap-poll] ${new Date().toISOString()} ${msg}`);

  const imapHost = process.env.IMAP_HOST || 'imappro.zoho.eu';
  const imapPort = parseInt(process.env.IMAP_PORT || '993');
  const imapUser = process.env.IMAP_USER || '';
  const imapPass = process.env.IMAP_PASS || '';
  const polledAt = new Date().toISOString();

  if (!imapUser || !imapPass) {
    return { ok: false, error: 'IMAP credentials not configured', processed: 0, skippedDedup: 0, logs, polledAt };
  }

  // eslint-disable-next-line
  const { ImapFlow } = require('imapflow');
  // eslint-disable-next-line
  const { simpleParser } = require('mailparser');

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

  try {
    log(`Connecting to ${imapHost}:${imapPort} as ${imapUser}...`);
    await client.connect();
    log('Connected and authenticated');

    await client.mailboxOpen('INBOX');
    log('INBOX opened');

    const since = new Date(Date.now() - LOOKBACK_MS);
    const uids: number[] = (await client.search({ since }, { uid: true })) || [];
    log(`Emails in last 48h: ${uids.length}`);

    // Take the latest 50, so a busy inbox never starves recent replies
    const batch = uids.slice(-50);
    if (!batch.length) {
      log('Nothing to process');
      return { ok: true, processed, skippedDedup, logs, polledAt };
    }

    for await (const msg of client.fetch(batch, { source: true }, { uid: true })) {
      const parsed = await simpleParser(msg.source);
      const subject: string = parsed.subject || '';
      const fromText: string = (parsed.from?.text || '').toLowerCase();
      const fromAddress: string = (parsed.from?.value?.[0]?.address || fromText).toLowerCase();
      const messageId: string | null = parsed.messageId || null;

      if (fromText.includes('colourking.nl')) continue;

      if (messageId) {
        const { data: existing } = await admin.from('email_log').select('id').eq('message_id', messageId).limit(1);
        if (existing?.length) {
          skippedDedup++;
          continue;
        }
      }

      const inReplyTo: string | null = parsed.inReplyTo || null;
      const refs: string[] = Array.isArray(parsed.references)
        ? parsed.references
        : parsed.references ? [parsed.references] : [];

      const target = await matchEntity(subject, [inReplyTo, ...refs].filter(Boolean) as string[], fromAddress);
      if (!target) continue;

      const text: string = (parsed.text || '').trim();
      const reply = extractReply(text) || text;
      const receivedAt = parsed.date ? parsed.date.toISOString() : new Date().toISOString();

      const { error } = await admin.from('email_log').insert({
        entity_type: target.entityType,
        entity_id: target.entityId,
        direction: 'inbound',
        from_email: fromAddress,
        to_email: imapUser,
        subject,
        snippet: reply.slice(0, 2000),
        body_text: text.slice(0, 20000),
        message_id: messageId,
        in_reply_to: inReplyTo,
        received_at: receivedAt,
      });
      if (error) {
        log(`ERROR storing ${fromAddress}: ${error.message}`);
        continue;
      }

      // Surface on the monitor / notification bell
      await admin.from('notifications').insert({
        type: 'new_email',
        title: `${fromAddress}: ${subject || '(no subject)'}`,
        body: reply.slice(0, 200),
        ref_type: target.entityType,
        ref_id: target.entityId,
        link: target.entityType === 'lead' ? `/app/leads/${target.entityId}` : null,
        staff_id: null,
      });

      log(`Processed: ${fromAddress} => ${target.entityType} ${target.entityId} (${target.matchedBy})`);
      processed++;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Command failed') || message.includes('LOGIN')) {
      log(`ERROR: Authentication failed — check IMAP_PASS is a Zoho App Password (not account password). Detail: ${message}`);
    } else if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND') || message.includes('timeout')) {
      log(`ERROR: Connection failed to ${imapHost}:${imapPort} — check IMAP_HOST and IMAP_PORT. Detail: ${message}`);
    } else {
      log(`ERROR: ${message}`);
    }
    return { ok: false, error: message, processed, skippedDedup, logs, polledAt };
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }

  log(`Done. Processed: ${processed} | Dedup-skipped: ${skippedDedup}`);
  return { ok: true, processed, skippedDedup, logs, polledAt };
}

type Match = { entityType: string; entityId: string; matchedBy: string };

async function matchEntity(subject: string, threadIds: string[], fromAddress: string): Promise<Match | null> {
  // 1. Subject tag
  const tag = subject.match(/\[(?:(JB|LD|FA|ES)-)?#?(\d{1,10})\]/i);
  if (tag) {
    const prefix = (tag[1] || '').toUpperCase();
    const entityType = prefix === 'JB' ? 'job' : prefix === 'FA' ? 'invoice' : prefix === 'ES' ? 'offer' : 'lead';
    const { data } = await admin.from(TABLES[entityType]).select('id').eq('number', parseInt(tag[2])).limit(1);
    if (data?.length) return { entityType, entityId: data[0].id, matchedBy: `subject ${tag[0]}` };
  }

  // 2. Reply headers pointing at something we sent or received
  if (threadIds.length) {
    const { data } = await admin
      .from('email_log')
      .select('entity_type, entity_id')
      .in('message_id', threadIds)
      .not('entity_id', 'is', null)
      .limit(1);
    if (data?.length) return { entityType: data[0].entity_type, entityId: data[0].entity_id, matchedBy: 'reply headers' };
  }

  // 3. Sender is the customer of a recent lead
  if (fromAddress.includes('@')) {
    const since = new Date(Date.now() - SENDER_MATCH_WINDOW_DAYS * 86400000).toISOString();
    const { data } = await admin
      .from('leads')
      .select('id')
      .ilike('contact_email', fromAddress.replace(/[\\%_]/g, '\\$&'))
      .is('deleted_at', null)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data?.length) return { entityType: 'lead', entityId: data[0].id, matchedBy: 'sender address' };
  }

  return null;
}
