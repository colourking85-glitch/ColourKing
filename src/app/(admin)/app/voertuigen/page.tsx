'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Vehicle = {
  id: string;
  kenteken: string | null;
  make: string | null;
  model: string | null;
  colour: string | null;
  year: number | null;
  wok: boolean;
  customers: { id: string; name: string } | null;
};

export default function VehiclesPage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/vehicles?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="VH05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <Link
          href="/app/voertuigen/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">
            {search ? t('noVehiclesFound') : t('noVehiclesMessage')}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
                <th className="px-4 py-3">{t('kenteken')}</th>
                <th className="px-4 py-3">{tCommon('vehicle')}</th>
                <th className="px-4 py-3">{t('colour')}</th>
                <th className="px-4 py-3">{t('owner')}</th>
                <th className="px-4 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                  <td className="px-4 py-3">
                    <Link href={`/app/voertuigen/${v.id}`} className="font-mono text-sm font-medium text-white hover:text-ck-red">
                      {v.kenteken ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">
                    {[v.make, v.model, v.year].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ck-muted-light">{v.colour ?? '—'}</td>
                  <td className="px-4 py-3">
                    {v.customers ? (
                      <Link href={`/app/klanten/${v.customers.id}`} className="text-sm text-ck-muted-light hover:text-white">
                        {v.customers.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-ck-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {v.wok && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <AlertTriangle size={12} /> WOK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
