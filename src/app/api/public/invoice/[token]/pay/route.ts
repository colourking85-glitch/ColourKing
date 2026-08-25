import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePaymentLink } from '@/lib/mollie';

/**
 * Public endpoint: create a Mollie payment for a token-based invoice.
 * No auth required — the token serves as the access control.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_cents, status, locale, payment_token')
      .eq('payment_token', params.token)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 409 });
    }

    if (invoice.status === 'credited' || invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is no longer payable' }, { status: 409 });
    }

    const checkoutUrl = await generatePaymentLink(
      invoice.id,
      invoice.invoice_number ?? 'DRAFT',
      invoice.total_cents,
      params.token,
      invoice.locale,
    );

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Could not create payment link' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
