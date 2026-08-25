/**
 * BTW (Dutch VAT) Calculator — pure functions, integer cents only.
 *
 * Dutch VAT rates:
 *   H21 — 21 % (standard)
 *   L9  —  9 % (reduced)
 *   N0  —  0 % (zero-rated)
 */

export type VatRate = 'H21' | 'L9' | 'N0';

export interface VatBreakdown {
  rate: VatRate;
  ratePercent: number;
  exclCents: number;
  vatCents: number;
  inclCents: number;
}

const RATE_MAP: Record<VatRate, number> = {
  H21: 21,
  L9: 9,
  N0: 0,
};

const ALL_RATES: VatRate[] = ['H21', 'L9', 'N0'];

/** Round half-up (banker-friendly). Works for positive and negative. */
function roundHalfUp(n: number): number {
  return Math.round(n);
}

/**
 * Given an amount *including* VAT (in cents) and a rate code,
 * returns the breakdown.
 */
export function calculateFromIncl(
  amountInclCents: number,
  rate: VatRate,
): VatBreakdown {
  const pct = RATE_MAP[rate];
  if (pct === 0) {
    return {
      rate,
      ratePercent: pct,
      exclCents: amountInclCents,
      vatCents: 0,
      inclCents: amountInclCents,
    };
  }
  const exclCents = roundHalfUp((amountInclCents * 100) / (100 + pct));
  const vatCents = amountInclCents - exclCents;
  return {
    rate,
    ratePercent: pct,
    exclCents,
    vatCents,
    inclCents: amountInclCents,
  };
}

/**
 * Given an amount *excluding* VAT (in cents) and a rate code,
 * returns the breakdown.
 */
export function calculateFromExcl(
  amountExclCents: number,
  rate: VatRate,
): VatBreakdown {
  const pct = RATE_MAP[rate];
  if (pct === 0) {
    return {
      rate,
      ratePercent: pct,
      exclCents: amountExclCents,
      vatCents: 0,
      inclCents: amountExclCents,
    };
  }
  const vatCents = roundHalfUp((amountExclCents * pct) / 100);
  const inclCents = amountExclCents + vatCents;
  return {
    rate,
    ratePercent: pct,
    exclCents: amountExclCents,
    vatCents,
    inclCents,
  };
}

/**
 * Calculate the breakdown for ALL three Dutch VAT rates at once.
 */
export function calculateAllRates(
  amountCents: number,
  inputType: 'incl' | 'excl',
): VatBreakdown[] {
  const fn = inputType === 'incl' ? calculateFromIncl : calculateFromExcl;
  return ALL_RATES.map((rate) => fn(amountCents, rate));
}
