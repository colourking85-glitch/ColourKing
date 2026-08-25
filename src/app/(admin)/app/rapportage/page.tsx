'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatCurrency } from '@/lib/format';
import { useAppLocale } from '@/components/AdminIntlProvider';

/* ── Types ──────────────────────────────────────────────────────────── */

type DateRange = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';
type Section = 'revenue' | 'jobs' | 'workload' | 'customers';

interface RevenueData {
  by_period: { period: string; total_cents: number; count: number }[];
  by_customer: { customer_id: string; customer_name: string; total_cents: number; invoice_count: number }[];
  by_type: { kind: string; total_cents: number }[];
  outstanding_cents: number;
  total_revenue_cents: number;
  average_invoice_cents: number;
}

interface JobsData {
  completed_count: number;
  average_cycle_days: number;
  average_value_cents: number;
  stages_snapshot: { stage: string; count: number }[];
  completed_by_month: { period: string; count: number }[];
}

interface WorkloadData {
  hours_by_staff: { staff_id: string; staff_name: string; total_minutes: number }[];
  task_completion: { total: number; done: number; rate: number };
  parts_turnaround_days: number;
}

interface CustomerData {
  new_by_month: { period: string; count: number }[];
  lead_conversion: { total: number; won: number; rate: number };
  repeat_count: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function getDateRange(range: DateRange, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (range) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      break;
    }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), 0, 1);
      end = customEnd ? new Date(customEnd) : now;
      break;
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/* ── CSS-only Chart Components ───────────────────────────────────────── */

function HorizontalBar({ label, value, maxValue, sublabel }: { label: string; value: number; maxValue: number; sublabel?: string }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-ck-text">{label}</span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-ck-text-muted">{sublabel ?? String(value)}</span>
      </div>
      <div className="h-5 overflow-hidden rounded bg-white/5">
        <div
          className="h-full rounded bg-ck-red transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function VerticalBarChart({ data, formatLabel }: { data: { label: string; value: number }[]; formatLabel?: (v: number) => string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatLabel ?? ((v: number) => String(v));
  return (
    <div className="flex items-end gap-1.5" style={{ height: 160 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
          <span className="text-[10px] font-mono tabular-nums text-ck-text-muted">{fmt(d.value)}</span>
          <div
            className="w-full rounded-t bg-ck-red transition-all duration-700 ease-out"
            style={{ height: `${Math.max(2, Math.round((d.value / maxVal) * 100))}%` }}
          />
          <span className="text-[10px] text-ck-text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StackedBar({ segments }: { segments: { kind: string; pct: number; color: string }[] }) {
  return (
    <div className="flex h-7 overflow-hidden rounded">
      {segments.map((s, i) => (
        <div
          key={i}
          className={`h-full transition-all duration-700 ease-out ${s.color}`}
          style={{ width: `${Math.max(1, s.pct)}%` }}
          title={`${s.kind}: ${s.pct}%`}
        />
      ))}
    </div>
  );
}

function KPICard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-ck-text-muted">{label}</div>
      <div className="mt-2 font-mono text-xl font-medium tabular-nums tracking-tight text-ck-text leading-none">{value}</div>
      {sublabel && <div className="mt-2 text-[12px] text-ck-text-muted">{sublabel}</div>}
    </div>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-[10px] border-[0.5px] border-dashed border-ck-border bg-ck-surface p-8 text-center">
      <p className="text-sm text-ck-text-muted">{message}</p>
    </div>
  );
}

const KIND_COLORS: Record<string, string> = {
  labour: 'bg-blue-500',
  part: 'bg-amber-500',
  material: 'bg-emerald-500',
  other: 'bg-purple-500',
};

/* ── Main Component ──────────────────────────────────────────────────── */

export default function ReportsPage() {
  const t = useTranslations('rp');
  const { locale } = useAppLocale();
  const centsToEuro = (c: number) => formatCurrency(c, locale);

  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('revenue');

  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [jobs, setJobs] = useState<JobsData | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [customers, setCustomers] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);
    const params = new URLSearchParams({ startDate, endDate });

    try {
      const [revRes, jobRes, wlRes, custRes] = await Promise.all([
        fetch(`/api/reports?type=revenue&${params}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/reports?type=jobs&${params}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/reports?type=workload&${params}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/reports?type=customers&${params}`).then((r) => r.ok ? r.json() : null),
      ]);
      setRevenue(revRes);
      setJobs(jobRes);
      setWorkload(wlRes);
      setCustomers(custRes);
    } catch {
      // Errors handled per-section via null checks
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sections: { id: Section; label: string }[] = [
    { id: 'revenue', label: t('sections.revenue') },
    { id: 'jobs', label: t('sections.jobs') },
    { id: 'workload', label: t('sections.workload') },
    { id: 'customers', label: t('sections.customers') },
  ];

  const dateRanges: { id: DateRange; label: string }[] = [
    { id: 'this_month', label: t('ranges.thisMonth') },
    { id: 'last_month', label: t('ranges.lastMonth') },
    { id: 'this_quarter', label: t('ranges.thisQuarter') },
    { id: 'this_year', label: t('ranges.thisYear') },
    { id: 'custom', label: t('ranges.custom') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-ck-border pb-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-ck-text">{t('title')}</h2>
          <p className="mt-1 text-[11px] text-ck-text-muted">{t('subtitle')}</p>
        </div>
        {loading && (
          <span className="text-[11px] text-ck-text-muted animate-pulse">{t('loading')}</span>
        )}
      </div>

      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-2">
        {dateRanges.map((r) => (
          <button
            key={r.id}
            onClick={() => setDateRange(r.id)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              dateRange === r.id
                ? 'bg-ck-red text-white'
                : 'bg-ck-surface border-[0.5px] border-ck-border text-ck-text-muted hover:text-ck-text'
            }`}
          >
            {r.label}
          </button>
        ))}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text"
            />
            <span className="text-xs text-ck-text-muted">-</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border-[0.5px] border-ck-border bg-ck-surface px-2 py-1.5 text-xs text-ck-text"
            />
          </div>
        )}
      </div>

      {/* Section tabs */}
      <nav className="flex gap-6 border-b border-ck-border">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`pb-3 text-sm transition-colors -mb-px border-b-2 ${
              activeSection === s.id
                ? 'border-ck-red font-medium text-ck-text'
                : 'border-transparent text-ck-text-muted hover:text-ck-text'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ── REVENUE ──────────────────────────────────────────────── */}
      {activeSection === 'revenue' && (
        <ErrorBoundary>
          {!revenue || (revenue.by_period.length === 0 && revenue.by_customer.length === 0) ? (
            <NoData message={t('noData')} />
          ) : (
            <div className="space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <KPICard label={t('kpi.totalRevenue')} value={centsToEuro(revenue.total_revenue_cents)} />
                <KPICard label={t('kpi.avgInvoice')} value={centsToEuro(revenue.average_invoice_cents)} />
                <KPICard label={t('kpi.outstanding')} value={centsToEuro(revenue.outstanding_cents)} />
                <KPICard label={t('kpi.invoiceCount')} value={String(revenue.by_period.reduce((s, r) => s + r.count, 0))} />
              </div>

              {/* Revenue by period */}
              <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                <h3 className="text-xs font-medium text-ck-text-2">{t('charts.revenueByPeriod')}</h3>
                <div className="mt-5">
                  <VerticalBarChart
                    data={revenue.by_period.map((r) => ({ label: r.period, value: r.total_cents }))}
                    formatLabel={(v) => centsToEuro(v)}
                  />
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* Revenue by customer */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.revenueByCustomer')}</h3>
                  <div className="mt-5 space-y-3">
                    {revenue.by_customer.length > 0 ? revenue.by_customer.map((c) => (
                      <HorizontalBar
                        key={c.customer_id}
                        label={c.customer_name}
                        value={c.total_cents}
                        maxValue={revenue.by_customer[0]?.total_cents ?? 1}
                        sublabel={centsToEuro(c.total_cents)}
                      />
                    )) : <p className="text-xs text-ck-text-muted">{t('noData')}</p>}
                  </div>
                </section>

                {/* Revenue by type */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.revenueByType')}</h3>
                  {revenue.by_type.length > 0 ? (
                    <>
                      <div className="mt-5">
                        <StackedBar
                          segments={revenue.by_type.map((r) => {
                            const total = revenue.by_type.reduce((s, x) => s + x.total_cents, 0);
                            return {
                              kind: r.kind,
                              pct: total > 0 ? Math.round((r.total_cents / total) * 100) : 0,
                              color: KIND_COLORS[r.kind] ?? 'bg-gray-500',
                            };
                          })}
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        {revenue.by_type.map((r) => (
                          <div key={r.kind} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${KIND_COLORS[r.kind] ?? 'bg-gray-500'}`} />
                              <span className="text-ck-text capitalize">{t(`kinds.${r.kind}`)}</span>
                            </div>
                            <span className="font-mono tabular-nums text-ck-text-muted">{centsToEuro(r.total_cents)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="mt-5 text-xs text-ck-text-muted">{t('noData')}</p>}
                </section>
              </div>
            </div>
          )}
        </ErrorBoundary>
      )}

      {/* ── JOBS ─────────────────────────────────────────────────── */}
      {activeSection === 'jobs' && (
        <ErrorBoundary>
          {!jobs ? (
            <NoData message={t('noData')} />
          ) : (
            <div className="space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <KPICard label={t('kpi.completed')} value={String(jobs.completed_count)} />
                <KPICard label={t('kpi.avgCycleTime')} value={`${jobs.average_cycle_days} d`} />
                <KPICard label={t('kpi.avgJobValue')} value={centsToEuro(jobs.average_value_cents)} />
                <KPICard
                  label={t('kpi.activeJobs')}
                  value={String(jobs.stages_snapshot.reduce((s, r) => s + r.count, 0))}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* Jobs by stage */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.jobsByStage')}</h3>
                  <div className="mt-5 space-y-3">
                    {jobs.stages_snapshot.length > 0 ? jobs.stages_snapshot.map((s) => (
                      <HorizontalBar
                        key={s.stage}
                        label={s.stage}
                        value={s.count}
                        maxValue={Math.max(...jobs.stages_snapshot.map((x) => x.count), 1)}
                      />
                    )) : <p className="text-xs text-ck-text-muted">{t('noData')}</p>}
                  </div>
                </section>

                {/* Completed per month */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.completedPerMonth')}</h3>
                  <div className="mt-5">
                    {jobs.completed_by_month.length > 0 ? (
                      <VerticalBarChart
                        data={jobs.completed_by_month.map((r) => ({ label: r.period, value: r.count }))}
                      />
                    ) : <p className="text-xs text-ck-text-muted">{t('noData')}</p>}
                  </div>
                </section>
              </div>
            </div>
          )}
        </ErrorBoundary>
      )}

      {/* ── WORKLOAD ─────────────────────────────────────────────── */}
      {activeSection === 'workload' && (
        <ErrorBoundary>
          {!workload ? (
            <NoData message={t('noData')} />
          ) : (
            <div className="space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                <KPICard
                  label={t('kpi.taskCompletion')}
                  value={`${workload.task_completion.rate}%`}
                  sublabel={`${workload.task_completion.done} / ${workload.task_completion.total}`}
                />
                <KPICard
                  label={t('kpi.partsTurnaround')}
                  value={`${workload.parts_turnaround_days} d`}
                />
                <KPICard
                  label={t('kpi.totalHours')}
                  value={`${Math.round(workload.hours_by_staff.reduce((s, r) => s + r.total_minutes, 0) / 60)} h`}
                />
              </div>

              {/* Hours per technician */}
              <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                <h3 className="text-xs font-medium text-ck-text-2">{t('charts.hoursPerTech')}</h3>
                <div className="mt-5 space-y-3">
                  {workload.hours_by_staff.length > 0 ? workload.hours_by_staff.map((s) => (
                    <HorizontalBar
                      key={s.staff_id}
                      label={s.staff_name}
                      value={s.total_minutes}
                      maxValue={workload.hours_by_staff[0]?.total_minutes ?? 1}
                      sublabel={`${Math.round(s.total_minutes / 60)} h`}
                    />
                  )) : <p className="text-xs text-ck-text-muted">{t('noData')}</p>}
                </div>
              </section>

              {/* Task completion bar */}
              <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                <h3 className="text-xs font-medium text-ck-text-2">{t('charts.taskCompletion')}</h3>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-ck-text-muted mb-2">
                    <span>{t('kpi.tasksDone')}: {workload.task_completion.done}</span>
                    <span>{t('kpi.tasksTotal')}: {workload.task_completion.total}</span>
                  </div>
                  <div className="h-5 overflow-hidden rounded bg-white/5">
                    <div
                      className="h-full rounded bg-emerald-500 transition-all duration-700 ease-out"
                      style={{ width: `${workload.task_completion.rate}%` }}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </ErrorBoundary>
      )}

      {/* ── CUSTOMERS ────────────────────────────────────────────── */}
      {activeSection === 'customers' && (
        <ErrorBoundary>
          {!customers ? (
            <NoData message={t('noData')} />
          ) : (
            <div className="space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                <KPICard
                  label={t('kpi.conversionRate')}
                  value={`${customers.lead_conversion.rate}%`}
                  sublabel={`${customers.lead_conversion.won} / ${customers.lead_conversion.total}`}
                />
                <KPICard label={t('kpi.repeatCustomers')} value={String(customers.repeat_count)} />
                <KPICard
                  label={t('kpi.newCustomers')}
                  value={String(customers.new_by_month.reduce((s, r) => s + r.count, 0))}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* New customers per month */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.newCustomersPerMonth')}</h3>
                  <div className="mt-5">
                    {customers.new_by_month.length > 0 ? (
                      <VerticalBarChart
                        data={customers.new_by_month.map((r) => ({ label: r.period, value: r.count }))}
                      />
                    ) : <p className="text-xs text-ck-text-muted">{t('noData')}</p>}
                  </div>
                </section>

                {/* Lead conversion */}
                <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
                  <h3 className="text-xs font-medium text-ck-text-2">{t('charts.leadConversion')}</h3>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-ck-text-muted mb-2">
                      <span>{t('kpi.leadsWon')}: {customers.lead_conversion.won}</span>
                      <span>{t('kpi.leadsTotal')}: {customers.lead_conversion.total}</span>
                    </div>
                    <div className="h-5 overflow-hidden rounded bg-white/5">
                      <div
                        className="h-full rounded bg-ck-red transition-all duration-700 ease-out"
                        style={{ width: `${customers.lead_conversion.rate}%` }}
                      />
                    </div>
                    <p className="mt-4 text-xs text-ck-text-muted">
                      {t('kpi.repeatCustomers')}: <span className="font-mono font-medium text-ck-text">{customers.repeat_count}</span>
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}
        </ErrorBoundary>
      )}
    </div>
  );
}
