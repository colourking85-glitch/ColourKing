import { NextRequest } from 'next/server';
import { handleManualSend } from '@/lib/send-email-route';
import { onAppointmentConfirmed, sendAppointmentReminder } from '@/modules/email/triggers';

/** POST { template: 'appointmentConfirmed' | 'appointmentReminder' } */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const reminder = body.template === 'appointmentReminder';
  return handleManualSend(() => (reminder ? sendAppointmentReminder(params.id) : onAppointmentConfirmed(params.id)));
}
