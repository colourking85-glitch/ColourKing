import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const id = params.id;

  const [
    customerRes,
    contactsRes,
    addressesRes,
    billingRes,
    agreementsRes,
    insuranceRes,
    consentsRes,
    notesRes,
    activitiesRes,
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('*, vehicles!vehicles_customer_id_fkey(id, kenteken, make, model, colour, year, status)')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', id)
      .order('is_primary', { ascending: false })
      .order('last_name'),
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', id)
      .order('is_default', { ascending: false }),
    supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', id)
      .maybeSingle(),
    supabase
      .from('customer_agreements')
      .select('*')
      .eq('customer_id', id)
      .order('version', { ascending: false }),
    supabase
      .from('customer_insurance_relations')
      .select('*, party:party_customer_id(id, name, type)')
      .eq('customer_id', id),
    supabase
      .from('customer_consents')
      .select('*')
      .eq('customer_id', id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('customer_activities')
      .select('*')
      .eq('customer_id', id)
      .order('occurred_at', { ascending: false })
      .limit(30),
  ]);

  if (customerRes.error) {
    return NextResponse.json({ error: customerRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    customer: customerRes.data,
    contacts: contactsRes.data || [],
    addresses: addressesRes.data || [],
    billing: billingRes.data,
    agreements: agreementsRes.data || [],
    insurance_relations: insuranceRes.data || [],
    consents: consentsRes.data || [],
    notes: notesRes.data || [],
    activities: activitiesRes.data || [],
  });
}
