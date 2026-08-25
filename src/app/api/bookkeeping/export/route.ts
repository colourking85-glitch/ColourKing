import { NextRequest, NextResponse } from 'next/server';
import { ExportParamsSchema } from '@/modules/bookkeeping/schema';
import {
  getInvoicesForExport,
  getPurchasesForExport,
  getVatReturnsForExport,
  getProfitLoss,
} from '@/modules/bookkeeping/queries';
import {
  invoicesToCsv,
  purchasesToCsv,
  vatReturnsToCsv,
  profitLossToCsv,
} from '@/modules/bookkeeping/export';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExportParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, startDate, endDate, year } = parsed.data;
    let csv: string;
    let filename: string;

    switch (type) {
      case 'invoices': {
        const invoices = await getInvoicesForExport(startDate, endDate);
        csv = invoicesToCsv(invoices);
        filename = `invoices_${startDate}_${endDate}.csv`;
        break;
      }

      case 'purchases': {
        const purchases = await getPurchasesForExport(startDate, endDate);
        csv = purchasesToCsv(purchases);
        filename = `purchases_${startDate}_${endDate}.csv`;
        break;
      }

      case 'vat': {
        const vatYear = year ?? new Date().getFullYear();
        const returns = await getVatReturnsForExport(vatYear);
        csv = vatReturnsToCsv(returns);
        filename = `vat_returns_${vatYear}.csv`;
        break;
      }

      case 'profit_loss': {
        const data = await getProfitLoss(startDate, endDate);
        csv = profitLossToCsv(data);
        filename = `profit_loss_${startDate}_${endDate}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
