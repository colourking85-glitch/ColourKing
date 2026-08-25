/**
 * Locale-aware formatting utilities.
 *
 * Money is stored as integer cents — these helpers convert for display.
 * All functions accept one of the three supported locales.
 */

export type SupportedLocale = 'nl' | 'en' | 'tr';

// ── BCP-47 tags used by Intl ────────────────────────────────────────────────
const BCP: Record<SupportedLocale, string> = {
  nl: 'nl-NL',
  en: 'en-GB',
  tr: 'tr-TR',
};

// ── Currency ────────────────────────────────────────────────────────────────

/**
 * Format cents to a locale-appropriate currency string.
 *
 *   NL  → € 1.234,56
 *   EN  → €1,234.56
 *   TR  → 1.234,56 €
 */
export function formatCurrency(cents: number, locale: SupportedLocale): string {
  const value = cents / 100;
  const bcp = BCP[locale];

  const formatted = new Intl.NumberFormat(bcp, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return formatted;
}

// ── Date (long) ─────────────────────────────────────────────────────────────

/**
 * Format a date in long human-readable form.
 *
 *   NL  → 25 augustus 2026
 *   EN  → 25 August 2026
 *   TR  → 25 Ağustos 2026
 */
export function formatDate(
  date: string | Date,
  locale: SupportedLocale,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(BCP[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// ── Date (short) ────────────────────────────────────────────────────────────

/**
 * Format a date in short numeric form.
 *
 *   NL  → 25-08-2026
 *   EN  → 25/08/2026
 *   TR  → 25.08.2026
 */
export function formatDateShort(
  date: string | Date,
  locale: SupportedLocale,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (locale) {
    case 'nl':
      return `${day}-${month}-${year}`;
    case 'en':
      return `${day}/${month}/${year}`;
    case 'tr':
      return `${day}.${month}.${year}`;
  }
}

// ── Number ──────────────────────────────────────────────────────────────────

/**
 * Format a number with locale-appropriate separators.
 *
 *   NL  → 1.234,56
 *   EN  → 1,234.56
 *   TR  → 1.234,56
 */
export function formatNumber(n: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(BCP[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
