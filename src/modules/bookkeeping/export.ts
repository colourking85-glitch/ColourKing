import type { ProfitLossData } from './queries';

/**
 * CSV generation for bookkeeping exports.
 * All monetary amounts stay in cents — the accountant imports as-is.
 */

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(escapeCsv).join(',');
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)];
  return lines.join('\n');
}

// ── Invoice CSV ─────────────────────────────────────────────────────────────

type InvoiceExportRow = {
  invoice_number: string | null;
  issued_at: string | null;
  customers: { name: string } | { name: string }[] | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  status: string;
  paid_at: string | null;
};

const INVOICE_HEADERS = [
  'invoice_number',
  'date',
  'customer',
  'subtotal_cents',
  'vat_cents',
  'total_cents',
  'status',
  'paid_date',
];

export function invoicesToCsv(invoices: InvoiceExportRow[]): string {
  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.issued_at ? inv.issued_at.slice(0, 10) : '',
    Array.isArray(inv.customers) ? (inv.customers[0]?.name ?? '') : (inv.customers?.name ?? ''),
    inv.subtotal_cents,
    inv.vat_cents,
    inv.total_cents,
    inv.status,
    inv.paid_at ? inv.paid_at.slice(0, 10) : '',
  ]);
  return toCsv(INVOICE_HEADERS, rows);
}

// ── Purchase CSV ────────────────────────────────────────────────────────────

type PurchaseExportRow = {
  invoice_date: string;
  supplier_name: string;
  description: string | null;
  category: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  paid: boolean;
};

const PURCHASE_HEADERS = [
  'date',
  'supplier',
  'description',
  'category',
  'subtotal_cents',
  'vat_cents',
  'total_cents',
  'paid',
];

export function purchasesToCsv(purchases: PurchaseExportRow[]): string {
  const rows = purchases.map((p) => [
    p.invoice_date,
    p.supplier_name,
    p.description,
    p.category,
    p.subtotal_cents,
    p.vat_cents,
    p.total_cents,
    p.paid,
  ]);
  return toCsv(PURCHASE_HEADERS, rows);
}

// ── VAT Return CSV ──────────────────────────────────────────────────────────

type VatReturnExportRow = {
  period_type: string;
  year: number;
  period: number;
  box1a_supplies_high: number;
  box1b_supplies_low: number;
  box1c_supplies_other: number;
  box1d_private_use: number;
  box1e_supplies_zero: number;
  box2a_supplies_from_eu: number;
  box4a_vat_on_supplies: number;
  box4b_vat_on_eu: number;
  box5a_vat_deductible: number;
  box5b_vat_balance: number;
  box5c_small_business: number;
  box5d_estimate_previous: number;
  box5e_total_payable: number;
  box5f_total_refund: number;
  status: string;
  filed_at: string | null;
};

const VAT_HEADERS = [
  'period',
  'box1a_supplies_high',
  'box1b_supplies_low',
  'box1c_supplies_other',
  'box1d_private_use',
  'box1e_supplies_zero',
  'box2a_supplies_from_eu',
  'box4a_vat_on_supplies',
  'box4b_vat_on_eu',
  'box5a_vat_deductible',
  'box5b_vat_balance',
  'box5c_small_business',
  'box5d_estimate_previous',
  'box5e_total_payable',
  'box5f_total_refund',
  'status',
  'filed_at',
];

function formatPeriodLabel(row: VatReturnExportRow): string {
  if (row.period_type === 'quarter') {
    return `${row.year}-Q${row.period}`;
  }
  return `${row.year}-${String(row.period).padStart(2, '0')}`;
}

export function vatReturnsToCsv(returns: VatReturnExportRow[]): string {
  const rows = returns.map((r) => [
    formatPeriodLabel(r),
    r.box1a_supplies_high,
    r.box1b_supplies_low,
    r.box1c_supplies_other,
    r.box1d_private_use,
    r.box1e_supplies_zero,
    r.box2a_supplies_from_eu,
    r.box4a_vat_on_supplies,
    r.box4b_vat_on_eu,
    r.box5a_vat_deductible,
    r.box5b_vat_balance,
    r.box5c_small_business,
    r.box5d_estimate_previous,
    r.box5e_total_payable,
    r.box5f_total_refund,
    r.status,
    r.filed_at ? r.filed_at.slice(0, 10) : '',
  ]);
  return toCsv(VAT_HEADERS, rows);
}

// ── Profit/Loss CSV ─────────────────────────────────────────────────────────

const PL_HEADERS = [
  'line',
  'category',
  'subtotal_cents',
  'vat_cents',
  'count',
];

export function profitLossToCsv(data: ProfitLossData): string {
  const rows: (string | number | null)[][] = [];

  // Revenue line
  rows.push(['revenue', 'total', data.revenue.total_cents, data.revenue.vat_cents, data.revenue.count]);

  // Cost lines by category
  for (const cat of data.costs.byCategory) {
    rows.push(['cost', cat.category, cat.subtotal_cents, cat.vat_cents, cat.count]);
  }

  // Cost total
  rows.push(['cost_total', 'all', data.costs.total_cents, data.costs.vat_cents, data.costs.count]);

  // Profit
  rows.push(['profit', 'net', data.profit_cents, 0, null]);

  return toCsv(PL_HEADERS, rows);
}
