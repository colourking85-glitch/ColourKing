import { NextResponse } from 'next/server';
import { VAT_PERIOD_LOCKED, vatLockPeriod } from './vat-period';

/**
 * 409 response for a write the database rejected because it touches a filed
 * VAT period, or null when the error is something else.
 */
export function vatLockedResponse(e: unknown): NextResponse | null {
  const period = vatLockPeriod(e);
  if (!period) return null;
  return NextResponse.json(
    { error: (e as Error).message, code: VAT_PERIOD_LOCKED, period },
    { status: 409 }
  );
}
