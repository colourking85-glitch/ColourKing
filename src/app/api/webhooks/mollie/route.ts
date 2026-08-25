import { NextRequest, NextResponse } from 'next/server';
import { handleMollieWebhook } from '@/lib/mollie';
import { recordPayment } from '@/modules/invoices/actions';
import { createClient } from '@/lib/supabase/server';

/**
 * Mollie webhook handler.
 * Mollie POSTs { id: "tr_xxx" } when a payment status changes.
 * No auth required — Mollie sends these directly.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const paymentId = formData.get('id') as string;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }

    // Fetch payment status from Mollie API
    const result = await handleMollieWebhook(paymentId);

    if (result.status === 'paid' && result.invoiceId) {
      // Check if payment already recorded
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('mollie_payment_id', result.molliePaymentId)
        .maybeSingle();

      if (!existing) {
        // Record the payment
        await recordPayment({
          invoice_id: result.invoiceId,
          amount_cents: result.amountCents,
          method: 'mollie',
          reference: result.invoiceNumber,
          mollie_payment_id: result.molliePaymentId,
          paid_at: result.paidAt,
        });
      }

      // Update mollie_payment_id on invoice
      await supabase
        .from('invoices')
        .update({ mollie_payment_id: result.molliePaymentId })
        .eq('id', result.invoiceId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Mollie webhook error:', e);
    // Always return 200 to Mollie to prevent retries for non-recoverable errors
    return NextResponse.json({ ok: true });
  }
}
