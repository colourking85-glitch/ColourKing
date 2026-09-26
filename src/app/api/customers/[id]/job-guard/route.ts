import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: billing } = await supabase
    .from('customer_billing')
    .select('credit_hold, credit_hold_reason')
    .eq('customer_id', params.id)
    .maybeSingle();

  const { data: customer } = await supabase
    .from('customers')
    .select('status')
    .eq('id', params.id)
    .single();

  const blocks: { code: string; message: string }[] = [];

  if (billing?.credit_hold) {
    blocks.push({
      code: 'CREDIT_HOLD',
      message: billing.credit_hold_reason || 'Credit hold active',
    });
  }

  if (customer?.status === 'blocked') {
    blocks.push({ code: 'BLOCKED', message: 'Customer is blocked' });
  }

  if (customer?.status === 'ended') {
    blocks.push({ code: 'ENDED', message: 'Customer relationship ended' });
  }

  return NextResponse.json({
    allowed: blocks.length === 0,
    blocks,
  });
}
