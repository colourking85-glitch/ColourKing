import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordPayment } from '@/modules/invoices/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const payment = await recordPayment({
      invoice_id: params.id,
      ...body,
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Can only record') ? 409
      : msg.includes('parse') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
