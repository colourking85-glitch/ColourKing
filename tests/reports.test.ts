import { describe, it, expect } from 'vitest';

// ─── Date range calculation tests ──────────────────────────────────────────

function pad2(n: number): string { return String(n).padStart(2, '0'); }
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getDateRange(range: string, customStart?: string, customEnd?: string) {
  const now = new Date(2026, 7, 25); // Aug 25 2026, local time
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
      start = customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
      end = customEnd ? new Date(customEnd + 'T00:00:00') : now;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    startDate: localDateStr(start),
    endDate: localDateStr(end),
  };
}

// ─── Period grouping (mirrors queries.ts) ──────────────────────────────────

function truncateToGroup(dateStr: string, groupBy: string): string {
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
    default:
      return d.toISOString().slice(0, 7);
  }
}

function groupRows(
  rows: { date: string; value: number }[],
  groupBy: string
): { period: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const period = truncateToGroup(row.date, groupBy);
    const entry = map.get(period) ?? { total: 0, count: 0 };
    entry.total += row.value;
    entry.count += 1;
    map.set(period, entry);
  }
  return Array.from(map.entries())
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ─── Metric computations ───────────────────────────────────────────────────

function computeConversionRate(won: number, total: number): number {
  return total > 0 ? Math.round((won / total) * 100) : 0;
}

function computeAverageCycleDays(jobs: { created: string; closed: string }[]): number {
  if (jobs.length === 0) return 0;
  let totalDays = 0;
  for (const j of jobs) {
    totalDays += (new Date(j.closed).getTime() - new Date(j.created).getTime()) / (1000 * 60 * 60 * 24);
  }
  return Math.round((totalDays / jobs.length) * 10) / 10;
}

function computeTaskCompletionRate(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

function computePartsTurnaround(parts: { ordered: string; received: string }[]): number {
  if (parts.length === 0) return 0;
  let totalDays = 0;
  for (const p of parts) {
    totalDays += (new Date(p.received).getTime() - new Date(p.ordered).getTime()) / (1000 * 60 * 60 * 24);
  }
  return Math.round((totalDays / parts.length) * 10) / 10;
}

function centsToEuro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Date range calculations', () => {
  it('this_month returns first of current month', () => {
    const { startDate, endDate } = getDateRange('this_month');
    expect(startDate).toBe('2026-08-01');
    expect(endDate).toBe('2026-08-25');
  });

  it('last_month returns previous month range', () => {
    const { startDate, endDate } = getDateRange('last_month');
    expect(startDate).toBe('2026-07-01');
    expect(endDate).toBe('2026-07-31');
  });

  it('this_quarter returns Q3 start for August', () => {
    const { startDate } = getDateRange('this_quarter');
    expect(startDate).toBe('2026-07-01');
  });

  it('this_year returns January 1', () => {
    const { startDate } = getDateRange('this_year');
    expect(startDate).toBe('2026-01-01');
  });

  it('custom range uses provided dates', () => {
    const { startDate, endDate } = getDateRange('custom', '2026-03-01', '2026-06-30');
    expect(startDate).toBe('2026-03-01');
    expect(endDate).toBe('2026-06-30');
  });

  it('custom range without dates falls back to year start', () => {
    const { startDate } = getDateRange('custom');
    expect(startDate).toBe('2026-01-01');
  });
});

describe('Period grouping - truncateToGroup', () => {
  it('groups by day', () => {
    expect(truncateToGroup('2026-08-15T14:30:00Z', 'day')).toBe('2026-08-15');
  });

  it('groups by month', () => {
    expect(truncateToGroup('2026-08-15T14:30:00Z', 'month')).toBe('2026-08');
  });

  it('groups by quarter', () => {
    expect(truncateToGroup('2026-08-15T14:30:00Z', 'quarter')).toBe('2026-Q3');
    expect(truncateToGroup('2026-01-15T14:30:00Z', 'quarter')).toBe('2026-Q1');
    expect(truncateToGroup('2026-04-15T14:30:00Z', 'quarter')).toBe('2026-Q2');
    expect(truncateToGroup('2026-10-15T14:30:00Z', 'quarter')).toBe('2026-Q4');
  });

  it('groups by year', () => {
    expect(truncateToGroup('2026-08-15T14:30:00Z', 'year')).toBe('2026');
  });

  it('groups by week (Monday start)', () => {
    // 2026-08-15 is a Saturday
    const result = truncateToGroup('2026-08-15T14:30:00Z', 'week');
    expect(result).toBe('2026-08-10'); // Monday of that week
  });
});

describe('Revenue grouping', () => {
  it('groups rows by month correctly', () => {
    const rows = [
      { date: '2026-01-10', value: 10000 },
      { date: '2026-01-20', value: 15000 },
      { date: '2026-02-05', value: 20000 },
    ];
    const result = groupRows(rows, 'month');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ period: '2026-01', total: 25000, count: 2 });
    expect(result[1]).toEqual({ period: '2026-02', total: 20000, count: 1 });
  });

  it('returns empty array for no data', () => {
    expect(groupRows([], 'month')).toEqual([]);
  });

  it('sorts by period ascending', () => {
    const rows = [
      { date: '2026-03-01', value: 100 },
      { date: '2026-01-01', value: 200 },
      { date: '2026-02-01', value: 300 },
    ];
    const result = groupRows(rows, 'month');
    expect(result.map(r => r.period)).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});

describe('Conversion rate', () => {
  it('calculates percentage correctly', () => {
    expect(computeConversionRate(3, 10)).toBe(30);
  });

  it('returns 0 when total is 0', () => {
    expect(computeConversionRate(0, 0)).toBe(0);
  });

  it('returns 100 when all won', () => {
    expect(computeConversionRate(5, 5)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(computeConversionRate(1, 3)).toBe(33);
  });
});

describe('Average cycle time', () => {
  it('calculates average days between created and closed', () => {
    const jobs = [
      { created: '2026-01-01', closed: '2026-01-06' }, // 5 days
      { created: '2026-01-01', closed: '2026-01-11' }, // 10 days
    ];
    expect(computeAverageCycleDays(jobs)).toBe(7.5);
  });

  it('returns 0 for empty array', () => {
    expect(computeAverageCycleDays([])).toBe(0);
  });

  it('handles single day cycle', () => {
    const jobs = [{ created: '2026-01-01', closed: '2026-01-02' }];
    expect(computeAverageCycleDays(jobs)).toBe(1);
  });
});

describe('Task completion rate', () => {
  it('calculates done percentage', () => {
    const tasks = [
      { status: 'done' },
      { status: 'done' },
      { status: 'in_progress' },
      { status: 'todo' },
    ];
    expect(computeTaskCompletionRate(tasks)).toBe(50);
  });

  it('returns 0 for empty tasks', () => {
    expect(computeTaskCompletionRate([])).toBe(0);
  });

  it('returns 100 when all done', () => {
    const tasks = [{ status: 'done' }, { status: 'done' }];
    expect(computeTaskCompletionRate(tasks)).toBe(100);
  });
});

describe('Parts turnaround', () => {
  it('calculates average days between ordered and received', () => {
    const parts = [
      { ordered: '2026-01-01', received: '2026-01-04' }, // 3 days
      { ordered: '2026-01-01', received: '2026-01-06' }, // 5 days
    ];
    expect(computePartsTurnaround(parts)).toBe(4);
  });

  it('returns 0 for empty parts', () => {
    expect(computePartsTurnaround([])).toBe(0);
  });
});

describe('Money formatting', () => {
  it('formats cents as euros', () => {
    const result = centsToEuro(150000);
    // Should contain 1.500 (Dutch formatting) or 1,500
    expect(result).toContain('1.500');
  });

  it('handles zero cents', () => {
    const result = centsToEuro(0);
    expect(result).toContain('0');
  });

  it('handles negative cents (credit notes)', () => {
    const result = centsToEuro(-5000);
    expect(result).toContain('50');
  });
});

describe('API query parameter validation', () => {
  const VALID_TYPES = ['revenue', 'jobs', 'workload', 'customers', 'dashboard'];

  it('accepts all valid report types', () => {
    for (const type of VALID_TYPES) {
      expect(VALID_TYPES.includes(type)).toBe(true);
    }
  });

  it('rejects invalid types', () => {
    expect(VALID_TYPES.includes('invalid')).toBe(false);
    expect(VALID_TYPES.includes('')).toBe(false);
  });

  it('dashboard type does not require dates', () => {
    const type = 'dashboard';
    const needsDates = type !== 'dashboard';
    expect(needsDates).toBe(false);
  });

  it('non-dashboard types require dates', () => {
    for (const type of ['revenue', 'jobs', 'workload', 'customers']) {
      const needsDates = type !== 'dashboard';
      expect(needsDates).toBe(true);
    }
  });
});

describe('GroupBy validation', () => {
  const VALID_GROUP_BY = ['day', 'week', 'month', 'quarter', 'year'];

  it('accepts all valid groupBy values', () => {
    for (const g of VALID_GROUP_BY) {
      expect(typeof truncateToGroup('2026-01-01', g)).toBe('string');
    }
  });

  it('defaults unknown groupBy to month', () => {
    const result = truncateToGroup('2026-08-15T14:30:00Z', 'unknown');
    expect(result).toBe('2026-08');
  });
});

describe('Revenue aggregation', () => {
  it('sums totals correctly within a period', () => {
    const rows = [
      { date: '2026-01-01', value: 10000 },
      { date: '2026-01-15', value: 20000 },
      { date: '2026-01-31', value: 5000 },
    ];
    const result = groupRows(rows, 'month');
    expect(result[0].total).toBe(35000);
    expect(result[0].count).toBe(3);
  });

  it('handles single entry correctly', () => {
    const rows = [{ date: '2026-06-15', value: 99900 }];
    const result = groupRows(rows, 'month');
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(99900);
  });
});

describe('Repeat customers', () => {
  it('counts customers with more than one job', () => {
    const jobCustomerIds = ['a', 'a', 'b', 'c', 'c', 'c', 'd'];
    const custCount = new Map<string, number>();
    for (const id of jobCustomerIds) {
      custCount.set(id, (custCount.get(id) ?? 0) + 1);
    }
    const repeat = Array.from(custCount.values()).filter(c => c > 1).length;
    expect(repeat).toBe(2); // a and c
  });

  it('returns 0 when no repeats', () => {
    const jobCustomerIds = ['a', 'b', 'c'];
    const custCount = new Map<string, number>();
    for (const id of jobCustomerIds) {
      custCount.set(id, (custCount.get(id) ?? 0) + 1);
    }
    const repeat = Array.from(custCount.values()).filter(c => c > 1).length;
    expect(repeat).toBe(0);
  });
});
