import { NextRequest, NextResponse } from 'next/server';
import {
  getRevenueByPeriod,
  getRevenueByCustomer,
  getRevenueByType,
  getOutstandingInvoices,
  getJobMetrics,
  getWorkloadMetrics,
  getCustomerMetrics,
  getDashboardKPIs,
} from '@/modules/reports/queries';
import type { GroupBy } from '@/modules/reports/queries';

const VALID_TYPES = ['revenue', 'jobs', 'workload', 'customers', 'dashboard'] as const;
type ReportType = (typeof VALID_TYPES)[number];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as ReportType | null;
  const startDate = sp.get('startDate') ?? sp.get('start_date');
  const endDate = sp.get('endDate') ?? sp.get('end_date');
  const groupBy = (sp.get('groupBy') ?? sp.get('group_by') ?? 'month') as GroupBy;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (type !== 'dashboard' && (!startDate || !endDate)) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    switch (type) {
      case 'revenue': {
        const [byPeriod, byCustomer, byType, outstanding] = await Promise.all([
          getRevenueByPeriod(startDate!, endDate!, groupBy),
          getRevenueByCustomer(startDate!, endDate!),
          getRevenueByType(startDate!, endDate!),
          getOutstandingInvoices(),
        ]);

        const totalRevenue = byPeriod.reduce((s, r) => s + r.total_cents, 0);
        const totalInvoices = byPeriod.reduce((s, r) => s + r.count, 0);

        return NextResponse.json({
          by_period: byPeriod,
          by_customer: byCustomer,
          by_type: byType,
          outstanding_cents: outstanding,
          total_revenue_cents: totalRevenue,
          average_invoice_cents: totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0,
        });
      }

      case 'jobs':
        return NextResponse.json(await getJobMetrics(startDate!, endDate!));

      case 'workload':
        return NextResponse.json(await getWorkloadMetrics(startDate!, endDate!));

      case 'customers':
        return NextResponse.json(await getCustomerMetrics(startDate!, endDate!));

      case 'dashboard':
        return NextResponse.json(await getDashboardKPIs());

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
