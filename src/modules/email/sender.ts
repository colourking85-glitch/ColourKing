/**
 * Email sending via Zoho SMTP (smtp.zoho.eu).
 * Emails appear in the Zoho Sent folder automatically.
 * Falls back to console.log when SMTP credentials are not set.
 */

import nodemailer, { type SendMailOptions } from 'nodemailer';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

type SendEmailOptions = {
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
};

type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function getSmtpUser(): string {
  return process.env.SMTP_USER ?? process.env.IMAP_USER ?? 'info@colourking.nl';
}

function getSmtpPass(): string | undefined {
  return process.env.SMTP_PASS ?? process.env.IMAP_PASS;
}

function getDefaultFrom(): string {
  return process.env.EMAIL_FROM ?? `Colourking <${getSmtpUser()}>`;
}

function getDefaultReplyTo(): string {
  return process.env.EMAIL_REPLY_TO ?? 'info@colourking.nl';
}

function createTransport() {
  const host = process.env.SMTP_HOST ?? 'smtp.zoho.eu';
  const port = Number(process.env.SMTP_PORT ?? 465);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: getSmtpUser(),
      pass: getSmtpPass(),
    },
  });
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
  const pass = getSmtpPass();

  if (!pass) {
    console.log('[EMAIL DRY-RUN]', {
      to,
      subject,
      from: options?.from ?? getDefaultFrom(),
      replyTo: options?.replyTo ?? getDefaultReplyTo(),
      htmlLength: html.length,
    });
    return { success: true, messageId: `dry-run-${Date.now()}` };
  }

  const transport = createTransport();

  const mailOptions: SendMailOptions = {
    from: options?.from ?? getDefaultFrom(),
    to,
    subject,
    html,
    replyTo: options?.replyTo ?? getDefaultReplyTo(),
    ...(options?.cc?.length ? { cc: options.cc } : {}),
    ...(options?.bcc?.length ? { bcc: options.bcc } : {}),
  };

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await transport.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return { success: false, error: lastError ?? 'Unknown error' };
}
