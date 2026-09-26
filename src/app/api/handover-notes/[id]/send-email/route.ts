import { NextRequest } from 'next/server';
import { handleManualSend } from '@/lib/send-email-route';
import { onHandoverShared } from '@/modules/email/triggers';

/** POST — email the customer the public link to view and sign the handover note. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleManualSend(() => onHandoverShared(params.id));
}
