/**
 * Mollie payment integration for ColourKing invoices.
 * Uses Mollie Payments API v2.
 * Docs: https://docs.mollie.com/reference/v2/payments-api
 */

const MOLLIE_API_BASE = 'https://api.mollie.com/v2';

function getApiKey(): string {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error('MOLLIE_API_KEY environment variable is not set');
  return key;
}

function getWebhookUrl(): string {
  return process.env.MOLLIE_WEBHOOK_URL ?? '';
}

function getRedirectBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.colourking.nl';
}

export interface MolliePaymentRequest {
  invoiceId: string;
  invoiceNumber: string;
  totalCents: number;
  description: string;
  redirectUrl: string;
  locale?: string;
}

export interface MolliePayment {
  id: string;
  status: string;
  amount: { currency: string; value: string };
  description: string;
  redirectUrl: string;
  _links: {
    checkout?: { href: string };
    self: { href: string };
  };
  metadata?: Record<string, string>;
  createdAt: string;
  paidAt?: string;
  method?: string;
}

async function mollieRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();

  const res = await fetch(`${MOLLIE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mollie API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Create a Mollie payment for an invoice.
 * Amount is converted from cents to EUR string (e.g., 12345 -> "123.45").
 */
export async function createMolliePayment(
  request: MolliePaymentRequest
): Promise<MolliePayment> {
  const amountEur = (request.totalCents / 100).toFixed(2);
  const webhookUrl = getWebhookUrl();

  const body: Record<string, unknown> = {
    amount: {
      currency: 'EUR',
      value: amountEur,
    },
    description: request.description,
    redirectUrl: request.redirectUrl,
    metadata: {
      invoice_id: request.invoiceId,
      invoice_number: request.invoiceNumber,
    },
  };

  if (webhookUrl) {
    body.webhookUrl = webhookUrl;
  }

  // Map locale to Mollie locale
  if (request.locale) {
    const localeMap: Record<string, string> = {
      nl: 'nl_NL',
      en: 'en_US',
      tr: 'tr_TR',
    };
    body.locale = localeMap[request.locale] ?? 'nl_NL';
  }

  return mollieRequest<MolliePayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Retrieve a Mollie payment by ID.
 */
export async function getMolliePayment(paymentId: string): Promise<MolliePayment> {
  return mollieRequest<MolliePayment>(`/payments/${paymentId}`);
}

/**
 * Process a Mollie webhook callback.
 * Mollie sends a POST with { id: "tr_xxx" } in the body.
 * We fetch the payment status and return the details.
 */
export async function handleMollieWebhook(paymentId: string): Promise<{
  molliePaymentId: string;
  status: string;
  paidAt: string | null;
  method: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  amountCents: number;
}> {
  const payment = await getMolliePayment(paymentId);

  // Parse amount back to cents
  const amountCents = Math.round(parseFloat(payment.amount.value) * 100);

  return {
    molliePaymentId: payment.id,
    status: payment.status,
    paidAt: payment.paidAt ?? null,
    method: payment.method ?? null,
    invoiceId: payment.metadata?.invoice_id ?? null,
    invoiceNumber: payment.metadata?.invoice_number ?? null,
    amountCents,
  };
}

/**
 * Generate a payment link URL for an invoice.
 * This creates a Mollie payment and returns the checkout URL.
 */
export async function generatePaymentLink(
  invoiceId: string,
  invoiceNumber: string,
  totalCents: number,
  token: string,
  locale?: string,
): Promise<string> {
  const redirectBase = getRedirectBase();
  const redirectUrl = `${redirectBase}/s/${token}?status=complete`;

  const payment = await createMolliePayment({
    invoiceId,
    invoiceNumber,
    totalCents,
    description: `${invoiceNumber}`,
    redirectUrl,
    locale,
  });

  return payment._links.checkout?.href ?? '';
}
