import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { invalidateCompanyCache } from '@/lib/company';

export async function GET() {
  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'company')
      .single();

    return NextResponse.json(data?.value ?? {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const ALLOWED_KEYS = [
      'name', 'legal_name', 'address', 'postcode', 'city', 'country',
      'phone', 'email', 'website',
      'kvk', 'vat_number', 'iban', 'bic', 'bank_name',
      'payment_terms_days', 'quote_validity_days', 'default_invoice_notes',
    ];

    const value: Record<string, unknown> = {};
    for (const key of ALLOWED_KEYS) {
      if (body[key] !== undefined) {
        value[key] = body[key];
      }
    }

    const { data: existing } = await admin
      .from('settings')
      .select('value')
      .eq('key', 'company')
      .single();

    const merged = { ...(existing?.value as Record<string, unknown> ?? {}), ...value };

    const { error } = await admin
      .from('settings')
      .upsert({ key: 'company', value: merged }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save company settings' }, { status: 500 });
    }

    invalidateCompanyCache();
    return NextResponse.json({ success: true, value: merged });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
