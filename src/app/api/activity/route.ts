import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  href: string;
  created_at: string;
  icon: string;
};

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20');
  const supabase = createClient();
  const activities: ActivityItem[] = [];

  const [jobEvents, notifications, leads, invoices] = await Promise.all([
    supabase
      .from('job_events')
      .select('id, job_id, event, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('notifications')
      .select('id, type, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('leads')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('invoices')
      .select('id, number, status, updated_at')
      .eq('status', 'paid')
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  if (jobEvents.data) {
    for (const ev of jobEvents.data) {
      activities.push({
        id: `je-${ev.id}`,
        type: 'job_event',
        title: ev.event,
        subtitle: typeof ev.payload === 'object' && ev.payload ? JSON.stringify(ev.payload).slice(0, 80) : null,
        href: `/app/jobs/${ev.job_id}`,
        created_at: ev.created_at,
        icon: 'wrench',
      });
    }
  }

  if (notifications.data) {
    for (const n of notifications.data) {
      activities.push({
        id: `notif-${n.id}`,
        type: 'notification',
        title: n.title,
        subtitle: n.body,
        href: '/app/monitoring',
        created_at: n.created_at,
        icon: 'bell',
      });
    }
  }

  if (leads.data) {
    for (const l of leads.data) {
      activities.push({
        id: `lead-${l.id}`,
        type: 'lead_created',
        title: `Lead: ${l.name}`,
        subtitle: l.status,
        href: `/app/leads/${l.id}`,
        created_at: l.created_at,
        icon: 'inbox',
      });
    }
  }

  if (invoices.data) {
    for (const inv of invoices.data) {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'invoice_paid',
        title: `Invoice ${inv.number} paid`,
        subtitle: null,
        href: `/app/facturen/${inv.id}`,
        created_at: inv.updated_at,
        icon: 'receipt',
      });
    }
  }

  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(activities.slice(0, limit));
}
