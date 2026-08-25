'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { calculateAllRates, type VatBreakdown } from '@/modules/btw-calculator/calculator';

function centsToDisplay(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}€ ${euros.toLocaleString('nl-NL')},${String(remainder).padStart(2, '0')}`;
}

function parseCentsFromInput(raw: string): number {
  // Strip everything except digits, comma, dot and minus
  const cleaned = raw.replace(/[^0-9,.\-]/g, '');
  if (!cleaned || cleaned === '-') return 0;
  // Treat comma as decimal separator (Dutch convention)
  const normalised = cleaned.replace(',', '.');
  const parsed = parseFloat(normalised);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

const RATE_LABELS: Record<string, string> = {
  H21: '21%',
  L9: '9%',
  N0: '0%',
};

export default function BtwCalculatorPage() {
  const t = useTranslations('bc');
  const [rawInput, setRawInput] = useState('');
  const [inputType, setInputType] = useState<'incl' | 'excl'>('incl');

  const amountCents = useMemo(() => parseCentsFromInput(rawInput), [rawInput]);
  const results: VatBreakdown[] = useMemo(
    () => calculateAllRates(amountCents, inputType),
    [amountCents, inputType],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Title */}
      <h1 className="text-xl font-[500] text-white">{t('title')}</h1>

      {/* Input section */}
      <div className="rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] p-5 space-y-4">
        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm text-[#6b6b80]">{t('amountLabel')}</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b80]">
              &euro;
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={t('amountPlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#0a0a0f] py-2.5 pl-8 pr-3 text-white placeholder:text-[#6b6b80] focus:border-[#E8364E] focus:outline-none"
            />
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInputType('incl')}
            className={`rounded-[10px] px-4 py-2 text-sm transition-colors ${
              inputType === 'incl'
                ? 'bg-[#E8364E] text-white'
                : 'border-[0.5px] border-[#1e1e2a] bg-[#0a0a0f] text-[#6b6b80] hover:text-white'
            }`}
          >
            {t('includesBtw')}
          </button>
          <button
            onClick={() => setInputType('excl')}
            className={`rounded-[10px] px-4 py-2 text-sm transition-colors ${
              inputType === 'excl'
                ? 'bg-[#E8364E] text-white'
                : 'border-[0.5px] border-[#1e1e2a] bg-[#0a0a0f] text-[#6b6b80] hover:text-white'
            }`}
          >
            {t('excludesBtw')}
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e2a] text-left text-[#6b6b80]">
              <th className="px-4 py-3 font-[500]">{t('colRate')}</th>
              <th className="px-4 py-3 font-[500] text-right">{t('colExBtw')}</th>
              <th className="px-4 py-3 font-[500] text-right">{t('colBtw')}</th>
              <th className="px-4 py-3 font-[500] text-right">{t('colInclBtw')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.rate} className="border-b border-[#1e1e2a] last:border-0">
                <td className="px-4 py-3 text-white">{RATE_LABELS[r.rate]}</td>
                <td className="px-4 py-3 text-right text-white tabular-nums">
                  {centsToDisplay(r.exclCents)}
                </td>
                <td className="px-4 py-3 text-right text-white tabular-nums">
                  {centsToDisplay(r.vatCents)}
                </td>
                <td className="px-4 py-3 text-right text-white tabular-nums">
                  {centsToDisplay(r.inclCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Helper text */}
      <p className="text-xs text-[#6b6b80]">{t('helperText')}</p>
    </div>
  );
}
