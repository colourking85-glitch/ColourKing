import { createClient } from '@/lib/supabase/server';

/* ── Types ──────────────────────────────────────────────────────────── */

export type GroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface RevenueByPeriod {
  period: string;
  total_cents: number;
  count: number;
}

export interface RevenueByCustomer {
  customer_id: string;
  customer_name: string;
  total_cents: number;
  invoice_count: number;
}

export interface RevenueByType {
  kind: string;
  total_cents: number;
}

export interface JobMetrics {
  completed_count: number;
  average_cycle_days: number;
  average_value_cents: number;
  stages_snapshot: { stage: string; count: number }[];
  completed_by_month: { period: string; count: number }[];
}

export interface WorkloadMetrics {
  hours_by_staff: { staff_id: string; staff_name: string; total_minutes: number }[];
  task_completion: { total: number; done: number; rate: number };
  parts_turnaround_days: number;
}

export interface CustomerMetrics {
  new_by_month: { period: string; count: number }[];
  lead_conversion: { total: number; won: number; rate: number };
  repeat_count: number;
}

export interface DashboardKPIs {
  active_jobs: number;
  pending_offers: number;
  overdue_invoices: number;
  today_appointments: number;
  outstanding_cents: number;
  revenue_this_month_cents: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function truncateToGroup(dateStr: string, groupBy: GroupBy): string {
  const d = new Date(dateStr);
  switch (groupBy) {
    case 'day':
      return d.toISOString().slice(0, 10);
    case 'week': {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      return monday.toISOString().slice(0, 10);
    }
    case 'month':
      return d.toISOString().slice(0, 7);
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}`;
    }
    case 'year':
      return `${d.getFullYear()}`;
  }
}

function groupRows<T>(
  rows: T[],
  dateKey: keyof T,
  valueKey: keyof T,
  groupBy: GroupBy
): RevenueByPeriod[] {
  const map = new Map<string, { total_cents: number; count: number }>();
  for (const row of rows) {
    const period = truncateToGroup(row[dateKey] as string, groupBy);
    const entry = map.get(period) ?? { total_cents: 0, count: 0 };
    entry.total_cents += (row[valueKey] as number) || 0;
    entry.count += 1;
    map.set(period, entry);
  }
  return Array.from(map.entries())
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/* ── Revenue queries ─────────────────────────────────────────────────── */

export async function getRevenueByPeriod(
  startDate: string,
  endDate: string,
  groupBy: GroupBy = 'month'
): Promise<RevenueByPeriod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('total_cents, created_at')
    .in('status', ['sent', 'paid', 'overdue'])
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return groupRows(data, 'created_at', 'total_cents', groupBy);
}

export async function getRevenueByCustomer(
  startDate: string,
  endDate: string,
  limit = 10
): Promise<RevenueByCustomer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('customer_id, total_cents, customers(name)')
    .in('status', ['sent', 'paid', 'overdue'])
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const map = new Map<string, { name: string; total_cents: number; count: number }>();
  for (const row of data) {
    const cid = row.customer_id;
    const entry = map.get(cid) ?? {
      name: (row.customers as unknown as { name: string })?.name ?? 'Unknown',
      total_cents: 0,
      count: 0,
    };
    entry.total_cents += row.total_cents || 0;
    entry.count += 1;
    map.set(cid, entry);
  }

  return Array.from(map.entries())
    .map(([customer_id, v]) => ({
      customer_id,
      customer_name: v.name,
      total_cents: v.total_cents,
      invoice_count: v.count,
    }))
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, limit);
}

export async function getRevenueByType(
  startDate: string,
  endDate: string
): Promise<RevenueByType[]> {
  const supabase = createClient();
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('id')
    .in('status', ['sent', 'paid', 'overdue'])
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (invErr) throw invErr;
  if (!invoices || invoices.length === 0) return [];

  const ids = invoices.map((i) => i.id);
  const { data: lines, error: lineErr } = await supabase
    .from('invoice_lines')
    .select('kind, line_total_cents')
    .in('invoice_id', ids);

  if (lineErr) throw lineErr;
  if (!lines || lines.length === 0) return [];

  const map = new Map<string, number>();
  for (const line of lines) {
    const kind = line.kind || 'other';
    map.set(kind, (map.get(kind) ?? 0) + (line.line_total_cents || 0));
  }

  return Array.from(map.entries())
    .map(([kind, total_cents]) => ({ kind, total_cents }))
    .sort((a, b) => b.total_cents - a.total_cents);
}

export async function getOutstandingInvoices(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('total_cents')
    .in('status', ['sent', 'overdue']);

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  return data.reduce((sum, row) => sum + (row.total_cents || 0), 0);
}

/* ── Job queries ─────────────────────────────────────────────────────── */

export async function getJobMetrics(
  startDate: string,
  endDate: string
): Promise<JobMetrics> {
  const supabase = createClient();

  // Completed jobs in range
  const { data: completed, error: compErr } = await supabase
    .from('jobs')
    .select('id, created_at, closed_at')
    .in('stage', ['delivered', 'closed'])
    .gte('closed_at', startDate)
    .lte('closed_at', endDate);

  if (compErr) throw compErr;

  // Current stages snapshot
  const { data: allJobs, error: allErr } = await supabase
    .from('jobs')
    .select('stage')
    .not('stage', 'eq', 'closed');

  if (allErr) throw allErr;

  // Stage counts
  const stageMap = new Map<string, number>();
  for (const j of allJobs ?? []) {
    stageMap.set(j.stage, (stageMap.get(j.stage) ?? 0) + 1);
  }
  const stages_snapshot = Array.from(stageMap.entries())
    .map(([stage, count]) => ({ stage, count }));

  // Cycle time calculation
  let totalDays = 0;
  let cycleCount = 0;
  const completedList = completed ?? [];
  for (const j of completedList) {
    if (j.created_at && j.closed_at) {
      const days = (new Date(j.closed_at).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
      cycleCount += 1;
    }
  }

  // Average job value — offer_id not yet populated in production
  const totalValue = 0;
  const valueCount = 0;

  // Completed by month
  const completed_by_month = groupRows(
    completedList.filter((j) => j.closed_at),
    'closed_at' as keyof typeof completedList[0],
    'id' as keyof typeof completedList[0],
    'month'
  ).map((r) => ({ period: r.period, count: r.count }));

  return {
    completed_count: completedList.length,
    average_cycle_days: cycleCount > 0 ? Math.round((totalDays / cycleCount) * 10) / 10 : 0,
    average_value_cents: valueCount > 0 ? Math.round(totalValue / valueCount) : 0,
    stages_snapshot,
    completed_by_month,
  };
}

/* ── Workload queries ────────────────────────────────────────────────── */

export async function getWorkloadMetrics(
  startDate: string,
  endDate: string
): Promise<WorkloadMetrics> {
  const supabase = createClient();

  // Hours by staff
  const { data: entries, error: teErr } = await supabase
    .from('time_entries')
    .select('staff_id, duration_minutes, staff:staff_id(name)')
    .gte('clock_in', startDate)
    .lte('clock_in', endDate);

  if (teErr) throw teErr;

  const staffMap = new Map<string, { name: string; total_minutes: number }>();
  for (const e of entries ?? []) {
    const entry = staffMap.get(e.staff_id) ?? {
      name: (e.staff as unknown as { name: string })?.name ?? 'Unknown',
      total_minutes: 0,
    };
    entry.total_minutes += e.duration_minutes ?? 0;
    staffMap.set(e.staff_id, entry);
  }
  const hours_by_staff = Array.from(staffMap.entries())
    .map(([staff_id, v]) => ({ staff_id, staff_name: v.name, total_minutes: v.total_minutes }))
    .sort((a, b) => b.total_minutes - a.total_minutes);

  // Task completion rate
  const { data: tasks, error: tkErr } = await supabase
    .from('job_tasks')
    .select('status')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (tkErr) throw tkErr;

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.status === 'done').length ?? 0;

  // Parts turnaround
  const { data: parts, error: ptErr } = await supabase
    .from('parts')
    .select('ordered_at, received_at')
    .not('ordered_at', 'is', null)
    .not('received_at', 'is', null)
    .gte('ordered_at', startDate)
    .lte('ordered_at', endDate);

  if (ptErr) throw ptErr;

  let turnaroundDays = 0;
  let turnaroundCount = 0;
  for (const p of parts ?? []) {
    if (p.ordered_at && p.received_at) {
      const days = (new Date(p.received_at).getTime() - new Date(p.ordered_at).getTime()) / (1000 * 60 * 60 * 24);
      turnaroundDays += days;
      turnaroundCount += 1;
    }
  }

  return {
    hours_by_staff,
    task_completion: {
      total,
      done,
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
    },
    parts_turnaround_days: turnaroundCount > 0 ? Math.round((turnaroundDays / turnaroundCount) * 10) / 10 : 0,
  };
}

/* ── Customer queries ────────────────────────────────────────────────── */

export async function getCustomerMetrics(
  startDate: string,
  endDate: string
): Promise<CustomerMetrics> {
  const supabase = createClient();

  // New customers per month
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (custErr) throw custErr;

  const new_by_month = groupRows(
    (customers ?? []).map((c) => ({ ...c, _one: 1 })),
    'created_at',
    '_one' as keyof { created_at: string; _one: number },
    'month'
  ).map((r) => ({ period: r.period, count: r.count }));

  // Lead conversion
  const { data: leads, error: leadErr } = await supabase
    .from('leads')
    .select('status')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (leadErr) throw leadErr;

  const totalLeads = leads?.length ?? 0;
  const wonLeads = leads?.filter((l) => l.status === 'won').length ?? 0;

  // Repeat customers (those with more than 1 job)
  const { data: jobCustomers, error: jcErr } = await supabase
    .from('jobs')
    .select('customer_id');

  if (jcErr) throw jcErr;

  const custCount = new Map<string, number>();
  for (const j of jobCustomers ?? []) {
    if (j.customer_id) {
      custCount.set(j.customer_id, (custCount.get(j.customer_id) ?? 0) + 1);
    }
  }
  const repeat_count = Array.from(custCount.values()).filter((c) => c > 1).length;

  return {
    new_by_month,
    lead_conversion: {
      total: totalLeads,
      won: wonLeads,
      rate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
    },
    repeat_count,
  };
}

/* ── Dashboard KPIs ──────────────────────────────────────────────────── */

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = createClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Active jobs (not closed/delivered)
  const { count: activeJobs } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .not('stage', 'in', '("delivered","closed")');

  // Pending offers
  const { count: pendingOffers } = await supabase
    .from('offers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent');

  // Overdue invoices
  const { count: overdueInvoices } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'overdue');

  // Today's appointments
  const { count: todayAppointments } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('scheduled_date', todayStr)
    .in('status', ['requested', 'confirmed']);

  // Outstanding amount
  const { data: outstanding } = await supabase
    .from('invoices')
    .select('total_cents')
    .in('status', ['sent', 'overdue']);

  const outstanding_cents = (outstanding ?? []).reduce(
    (sum, row) => sum + (row.total_cents || 0),
    0
  );

  // Revenue this month
  const { data: monthRevenue } = await supabase
    .from('invoices')
    .select('total_cents')
    .in('status', ['sent', 'paid', 'overdue'])
    .gte('created_at', monthStart);

  const revenue_this_month_cents = (monthRevenue ?? []).reduce(
    (sum, row) => sum + (row.total_cents || 0),
    0
  );

  return {
    active_jobs: activeJobs ?? 0,
    pending_offers: pendingOffers ?? 0,
    overdue_invoices: overdueInvoices ?? 0,
    today_appointments: todayAppointments ?? 0,
    outstanding_cents,
    revenue_this_month_cents,
  };
}
