import { describe, it, expect } from 'vitest';
import {
  ExportParamsSchema,
  PeriodSchema,
  periodToDateRange,
  type PeriodInput,
} from '../src/modules/bookkeeping/schema';
import {
  invoicesToCsv,
  purchasesToCsv,
  vatReturnsToCsv,
  profitLossToCsv,
} from '../src/modules/bookkeeping/export';
import type { ProfitLossData } from '../src/modules/bookkeeping/queries';

// ── Schema validation ──────────────────────────────────────────────────────

describe('ExportParamsSchema', () => {
  it('accepts valid invoices params', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'invoices',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid purchases params', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'purchases',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid vat params with year', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'vat',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      year: 2026,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid profit_loss params', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'profit_loss',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid export type', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'balance_sheet',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty startDate', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'invoices',
      startDate: '',
      endDate: '2026-12-31',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty endDate', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'invoices',
      startDate: '2026-01-01',
      endDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = ExportParamsSchema.safeParse({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(result.success).toBe(false);
  });

  it('rejects year below 2020', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'vat',
      startDate: '2019-01-01',
      endDate: '2019-12-31',
      year: 2019,
    });
    expect(result.success).toBe(false);
  });

  it('rejects year above 2099', () => {
    const result = ExportParamsSchema.safeParse({
      type: 'vat',
      startDate: '2100-01-01',
      endDate: '2100-12-31',
      year: 2100,
    });
    expect(result.success).toBe(false);
  });
});

describe('PeriodSchema', () => {
  it('accepts valid month period', () => {
    const result = PeriodSchema.safeParse({ periodType: 'month', year: 2026, period: 6 });
    expect(result.success).toBe(true);
  });

  it('accepts valid quarter period', () => {
    const result = PeriodSchema.safeParse({ periodType: 'quarter', year: 2026, period: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts year period without period number', () => {
    const result = PeriodSchema.safeParse({ periodType: 'year', year: 2026 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid period type', () => {
    const result = PeriodSchema.safeParse({ periodType: 'week', year: 2026 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer year', () => {
    const result = PeriodSchema.safeParse({ periodType: 'year', year: 2026.5 });
    expect(result.success).toBe(false);
  });
});

// ── Period date range ──────────────────────────────────────────────────────

describe('periodToDateRange', () => {
  it('computes year range', () => {
    const range = periodToDateRange({ periodType: 'year', year: 2026 });
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-12-31');
  });

  it('computes Q1 range', () => {
    const range = periodToDateRange({ periodType: 'quarter', year: 2026, period: 1 });
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-03-31');
  });

  it('computes Q2 range', () => {
    const range = periodToDateRange({ periodType: 'quarter', year: 2026, period: 2 });
    expect(range.startDate).toBe('2026-04-01');
    expect(range.endDate).toBe('2026-06-30');
  });

  it('computes Q3 range', () => {
    const range = periodToDateRange({ periodType: 'quarter', year: 2026, period: 3 });
    expect(range.startDate).toBe('2026-07-01');
    expect(range.endDate).toBe('2026-09-30');
  });

  it('computes Q4 range', () => {
    const range = periodToDateRange({ periodType: 'quarter', year: 2026, period: 4 });
    expect(range.startDate).toBe('2026-10-01');
    expect(range.endDate).toBe('2026-12-31');
  });

  it('computes January range', () => {
    const range = periodToDateRange({ periodType: 'month', year: 2026, period: 1 });
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-01-31');
  });

  it('computes February range (non-leap year)', () => {
    const range = periodToDateRange({ periodType: 'month', year: 2026, period: 2 });
    expect(range.startDate).toBe('2026-02-01');
    expect(range.endDate).toBe('2026-02-28');
  });

  it('computes February range (leap year)', () => {
    const range = periodToDateRange({ periodType: 'month', year: 2024, period: 2 });
    expect(range.startDate).toBe('2024-02-01');
    expect(range.endDate).toBe('2024-02-29');
  });

  it('computes December range', () => {
    const range = periodToDateRange({ periodType: 'month', year: 2026, period: 12 });
    expect(range.startDate).toBe('2026-12-01');
    expect(range.endDate).toBe('2026-12-31');
  });

  it('defaults period to 1 for quarter when omitted', () => {
    const range = periodToDateRange({ periodType: 'quarter', year: 2026 });
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-03-31');
  });

  it('defaults period to 1 for month when omitted', () => {
    const range = periodToDateRange({ periodType: 'month', year: 2026 });
    expect(range.startDate).toBe('2026-01-01');
    expect(range.endDate).toBe('2026-01-31');
  });
});

// ── CSV generation ─────────────────────────────────────────────────────────

describe('invoicesToCsv', () => {
  it('outputs correct headers', () => {
    const csv = invoicesToCsv([]);
    const headers = csv.split('\n')[0];
    expect(headers).toBe('invoice_number,date,customer,subtotal_cents,vat_cents,total_cents,status,paid_date');
  });

  it('formats a single invoice row', () => {
    const csv = invoicesToCsv([
      {
        invoice_number: 'FA-2026-001',
        issued_at: '2026-03-15T10:00:00Z',
        customers: { name: 'Jan de Vries' },
        subtotal_cents: 10000,
        vat_cents: 2100,
        total_cents: 12100,
        status: 'paid',
        paid_at: '2026-03-20T12:00:00Z',
      },
    ]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('FA-2026-001,2026-03-15,Jan de Vries,10000,2100,12100,paid,2026-03-20');
  });

  it('handles null customer', () => {
    const csv = invoicesToCsv([
      {
        invoice_number: 'FA-2026-002',
        issued_at: '2026-01-01T00:00:00Z',
        customers: null,
        subtotal_cents: 5000,
        vat_cents: 1050,
        total_cents: 6050,
        status: 'sent',
        paid_at: null,
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toContain(',,5000');
  });

  it('keeps amounts in cents (integers)', () => {
    const csv = invoicesToCsv([
      {
        invoice_number: 'FA-2026-003',
        issued_at: '2026-06-01T00:00:00Z',
        customers: { name: 'Test' },
        subtotal_cents: 99999,
        vat_cents: 20999,
        total_cents: 120998,
        status: 'paid',
        paid_at: '2026-06-05T00:00:00Z',
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toContain('99999,20999,120998');
  });

  it('escapes commas in customer name', () => {
    const csv = invoicesToCsv([
      {
        invoice_number: 'FA-2026-004',
        issued_at: '2026-01-01T00:00:00Z',
        customers: { name: 'Bakker, Van Dijk & Co' },
        subtotal_cents: 1000,
        vat_cents: 210,
        total_cents: 1210,
        status: 'sent',
        paid_at: null,
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toContain('"Bakker, Van Dijk & Co"');
  });
});

describe('purchasesToCsv', () => {
  it('outputs correct headers', () => {
    const csv = purchasesToCsv([]);
    const headers = csv.split('\n')[0];
    expect(headers).toBe('date,supplier,description,category,subtotal_cents,vat_cents,total_cents,paid');
  });

  it('formats a purchase row', () => {
    const csv = purchasesToCsv([
      {
        invoice_date: '2026-02-10',
        supplier_name: 'Verfwinkel BV',
        description: 'Spuitverf rood',
        category: 'paint',
        subtotal_cents: 5000,
        vat_cents: 1050,
        total_cents: 6050,
        paid: true,
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toBe('2026-02-10,Verfwinkel BV,Spuitverf rood,paint,5000,1050,6050,true');
  });

  it('handles null description', () => {
    const csv = purchasesToCsv([
      {
        invoice_date: '2026-01-01',
        supplier_name: 'Supplier',
        description: null,
        category: 'general',
        subtotal_cents: 1000,
        vat_cents: 210,
        total_cents: 1210,
        paid: false,
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toBe('2026-01-01,Supplier,,general,1000,210,1210,false');
  });
});

describe('vatReturnsToCsv', () => {
  it('outputs correct headers', () => {
    const csv = vatReturnsToCsv([]);
    const headers = csv.split('\n')[0];
    expect(headers).toContain('period');
    expect(headers).toContain('box1a_supplies_high');
    expect(headers).toContain('box5e_total_payable');
    expect(headers).toContain('box5f_total_refund');
  });

  it('formats quarter period label', () => {
    const csv = vatReturnsToCsv([
      {
        period_type: 'quarter',
        year: 2026,
        period: 2,
        box1a_supplies_high: 100000,
        box1b_supplies_low: 0,
        box1c_supplies_other: 0,
        box1d_private_use: 0,
        box1e_supplies_zero: 0,
        box2a_supplies_from_eu: 0,
        box4a_vat_on_supplies: 21000,
        box4b_vat_on_eu: 0,
        box5a_vat_deductible: 5000,
        box5b_vat_balance: 16000,
        box5c_small_business: 0,
        box5d_estimate_previous: 0,
        box5e_total_payable: 16000,
        box5f_total_refund: 0,
        status: 'filed',
        filed_at: '2026-07-15T10:00:00Z',
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toMatch(/^2026-Q2,/);
  });

  it('formats month period label', () => {
    const csv = vatReturnsToCsv([
      {
        period_type: 'month',
        year: 2026,
        period: 3,
        box1a_supplies_high: 50000,
        box1b_supplies_low: 0,
        box1c_supplies_other: 0,
        box1d_private_use: 0,
        box1e_supplies_zero: 0,
        box2a_supplies_from_eu: 0,
        box4a_vat_on_supplies: 10500,
        box4b_vat_on_eu: 0,
        box5a_vat_deductible: 2000,
        box5b_vat_balance: 8500,
        box5c_small_business: 0,
        box5d_estimate_previous: 0,
        box5e_total_payable: 8500,
        box5f_total_refund: 0,
        status: 'filed',
        filed_at: '2026-04-20T10:00:00Z',
      },
    ]);
    const line = csv.split('\n')[1];
    expect(line).toMatch(/^2026-03,/);
  });
});

describe('profitLossToCsv', () => {
  const sampleData: ProfitLossData = {
    revenue: { total_cents: 200000, vat_cents: 42000, count: 5 },
    costs: {
      total_cents: 80000,
      vat_cents: 16800,
      count: 10,
      byCategory: [
        { category: 'parts', subtotal_cents: 50000, vat_cents: 10500, total_cents: 60500, count: 6 },
        { category: 'paint', subtotal_cents: 30000, vat_cents: 6300, total_cents: 36300, count: 4 },
      ],
    },
    profit_cents: 120000,
  };

  it('outputs correct headers', () => {
    const csv = profitLossToCsv(sampleData);
    const headers = csv.split('\n')[0];
    expect(headers).toBe('line,category,subtotal_cents,vat_cents,count');
  });

  it('includes revenue line', () => {
    const csv = profitLossToCsv(sampleData);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('revenue,total,200000,42000,5');
  });

  it('includes cost category lines', () => {
    const csv = profitLossToCsv(sampleData);
    const lines = csv.split('\n');
    expect(lines[2]).toBe('cost,parts,50000,10500,6');
    expect(lines[3]).toBe('cost,paint,30000,6300,4');
  });

  it('includes cost total line', () => {
    const csv = profitLossToCsv(sampleData);
    const lines = csv.split('\n');
    expect(lines[4]).toBe('cost_total,all,80000,16800,10');
  });

  it('includes profit line', () => {
    const csv = profitLossToCsv(sampleData);
    const lines = csv.split('\n');
    expect(lines[5]).toBe('profit,net,120000,0,');
  });

  it('handles empty costs', () => {
    const emptyData: ProfitLossData = {
      revenue: { total_cents: 50000, vat_cents: 10500, count: 2 },
      costs: { total_cents: 0, vat_cents: 0, count: 0, byCategory: [] },
      profit_cents: 50000,
    };
    const csv = profitLossToCsv(emptyData);
    const lines = csv.split('\n');
    // header + revenue + cost_total + profit = 4 lines
    expect(lines).toHaveLength(4);
  });

  it('handles negative profit', () => {
    const lossData: ProfitLossData = {
      revenue: { total_cents: 30000, vat_cents: 6300, count: 1 },
      costs: {
        total_cents: 50000,
        vat_cents: 10500,
        count: 3,
        byCategory: [
          { category: 'rent', subtotal_cents: 50000, vat_cents: 10500, total_cents: 60500, count: 3 },
        ],
      },
      profit_cents: -20000,
    };
    const csv = profitLossToCsv(lossData);
    const lines = csv.split('\n');
    const profitLine = lines[lines.length - 1];
    expect(profitLine).toContain('-20000');
  });

  it('keeps all amounts as integer cents', () => {
    const csv = profitLossToCsv(sampleData);
    // No decimal points in the CSV amounts
    const dataLines = csv.split('\n').slice(1);
    for (const line of dataLines) {
      const parts = line.split(',');
      // subtotal_cents is at index 2
      const amount = parts[2];
      expect(amount).toMatch(/^-?\d+$/);
    }
  });
});
