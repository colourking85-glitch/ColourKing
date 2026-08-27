import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SearchResult = {
  type: 'customer' | 'vehicle' | 'job' | 'lead' | 'invoice';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = createClient();
  const results: SearchResult[] = [];
  const pattern = `%${q}%`;

  const [customers, vehicles, jobs, leads, invoices] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email, phone, type')
      .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('vehicles')
      .select('id, kenteken, make, model, customer_id')
      .is('deleted_at', null)
      .or(`kenteken.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('jobs')
      .select('id, reference, stage, description')
      .or(`reference.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('leads')
      .select('id, name, email, phone, status')
      .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('invoices')
      .select('id, number, status, total_incl_cents')
      .or(`number.ilike.${pattern}`)
      .limit(5),
  ]);

  if (customers.data) {
    for (const c of customers.data) {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: c.email || c.phone || c.type,
        href: `/app/klanten/${c.id}`,
      });
    }
  }

  if (vehicles.data) {
    for (const v of vehicles.data) {
      results.push({
        type: 'vehicle',
        id: v.id,
        title: v.kenteken || 'Unknown',
        subtitle: [v.make, v.model].filter(Boolean).join(' '),
        href: `/app/voertuigen/${v.id}`,
      });
    }
  }

  if (jobs.data) {
    for (const j of jobs.data) {
      results.push({
        type: 'job',
        id: j.id,
        title: j.reference || `Job ${j.id.slice(0, 8)}`,
        subtitle: j.stage,
        href: `/app/jobs/${j.id}`,
      });
    }
  }

  if (leads.data) {
    for (const l of leads.data) {
      results.push({
        type: 'lead',
        id: l.id,
        title: l.name,
        subtitle: l.status,
        href: `/app/leads/${l.id}`,
      });
    }
  }

  if (invoices.data) {
    for (const inv of invoices.data) {
      results.push({
        type: 'invoice',
        id: inv.id,
        title: inv.number || `Invoice ${inv.id.slice(0, 8)}`,
        subtitle: inv.status,
        href: `/app/facturen/${inv.id}`,
      });
    }
  }

  return NextResponse.json(results);
}
