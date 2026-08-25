/**
 * Email sending abstraction using Resend API via fetch().
 * Gracefully falls back to console.log when RESEND_API_KEY is not set.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

type SendEmailOptions = {
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
};

type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function getApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

function getDefaultFrom(): string {
  return process.env.EMAIL_FROM ?? 'Colourking <noreply@colourking.nl>';
}

function getDefaultReplyTo(): string {
  return process.env.EMAIL_REPLY_TO ?? 'info@colourking.nl';
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: SendEmailOptions,
): Promise<SendEmailResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    // Dry-run mode: log to console
    console.log('[EMAIL DRY-RUN]', {
      to,
      subject,
      from: options?.from ?? getDefaultFrom(),
      replyTo: options?.replyTo ?? getDefaultReplyTo(),
      htmlLength: html.length,
    });
    return { success: true, messageId: `dry-run-${Date.now()}` };
  }

  const payload = {
    from: options?.from ?? getDefaultFrom(),
    to: [to],
    subject,
    html,
    reply_to: options?.replyTo ?? getDefaultReplyTo(),
    ...(options?.cc?.length ? { cc: options.cc } : {}),
    ...(options?.bcc?.length ? { bcc: options.bcc } : {}),
    ...(options?.tags?.length ? { tags: options.tags } : {}),
  };

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { success: true, messageId: data.id };
      }

      const errorBody = await res.text();
      lastError = `Resend API ${res.status}: ${errorBody}`;

      // Don't retry on 4xx client errors (except 429 rate limit)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { success: false, error: lastError };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return { success: false, error: lastError ?? 'Unknown error' };
}
