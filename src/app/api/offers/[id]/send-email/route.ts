import { NextRequest } from 'next/server';
import { handleManualSend } from '@/lib/send-email-route';
import { onOfferSent } from '@/modules/email/triggers';

/** POST — (re)send the offer email to the customer. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleManualSend(() => onOfferSent(params.id));
}
