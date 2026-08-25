import { z } from 'zod';

export const EXPORT_TYPES = ['invoices', 'purchases', 'vat', 'profit_loss'] as const;
export type ExportType = (typeof EXPORT_TYPES)[number];

export const PERIOD_TYPES = ['month', 'quarter', 'year'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const ExportParamsSchema = z.object({
  type: z.enum(EXPORT_TYPES),
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
  year: z.number().int().min(2020).max(2099).optional(),
});

export const PeriodSchema = z.object({
  periodType: z.enum(PERIOD_TYPES),
  year: z.number().int().min(2020).max(2099),
  period: z.number().int().min(1).max(12).optional(),
});

export type ExportParams = z.infer<typeof ExportParamsSchema>;
export type PeriodInput = z.infer<typeof PeriodSchema>;

/**
 * Compute start and end dates from a period specification.
 */
export function periodToDateRange(input: PeriodInput): { startDate: string; endDate: string } {
  const { periodType, year, period } = input;

  switch (periodType) {
    case 'year':
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    case 'quarter': {
      const q = period ?? 1;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const lastDay = new Date(year, endMonth, 0).getDate();
      return {
        startDate: `${year}-${String(startMonth).padStart(2, '0')}-01`,
        endDate: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    case 'month': {
      const m = period ?? 1;
      const lastDay = new Date(year, m, 0).getDate();
      return {
        startDate: `${year}-${String(m).padStart(2, '0')}-01`,
        endDate: `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}
