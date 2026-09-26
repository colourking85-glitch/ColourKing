import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canTransition } from '@/modules/invoices/machine';
import type { InvoiceStatus } from '@/types/database';

export async function PATCH(req: NextRequest) {
  const { ids, status }: { ids: string[]; status: InvoiceStatus } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return NextResponse.json({ error: 'ids and status required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: invoices, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, status')
    .in('id', ids);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const inv of invoices ?? []) {
    const from = inv.status as InvoiceStatus;
    if (!canTransition(from, status)) {
      results.push({ id: inv.id, ok: false, error: `Cannot transition from ${from} to ${status}` });
      continue;
    }

    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', inv.id);

    results.push({ id: inv.id, ok: !error, error: error?.message });
  }

  return NextResponse.json({ results });
}
