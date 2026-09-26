import { NextRequest } from 'next/server';
import { handleManualSend } from '@/lib/send-email-route';
import { onInvoiceIssued, sendInvoiceReminder } from '@/modules/email/triggers';

/** POST { template: 'invoiceSent' | 'invoiceReminder' } — resend the invoice or send a payment reminder. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const template = body.template === 'invoiceReminder' ? 'invoiceReminder' : 'invoiceSent';
  return handleManualSend(() => (template === 'invoiceReminder' ? sendInvoiceReminder(params.id) : onInvoiceIssued(params.id)));
}
