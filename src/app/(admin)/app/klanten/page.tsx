'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, User, Building2, Truck, Store } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Customer = {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
};

const TYPE_ICONS: Record<string, typeof User> = {
  private: User,
  company: Building2,
  fleet: Truck,
  dealer: Store,
};

const TYPE_LABELS: Record<string, string> = {
  private: 'Particulier',
  company: 'Bedrijf',
  fleet: 'Wagenpark',
  dealer: 'Dealer',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/customers?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="KL05" />
          <h1 className="font-display text-2xl font-bold text-white">Klanten</h1>
        </div>
        <Link
          href="/app/klanten/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          Nieuwe klant
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
        <input
          type="text"
          placeholder="Zoek op naam, email of telefoon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">Laden...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-ck-muted">
            {search ? 'Geen klanten gevonden' : 'Nog geen klanten. Maak de eerste aan.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefoon</th>
                <th className="px-4 py-3">Stad</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const Icon = TYPE_ICONS[c.type] ?? User;
                return (
                  <tr key={c.id} className="border-b border-ck-dark-border/50 hover:bg-ck-dark-surface">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs text-ck-muted">
                        <Icon size={14} />
                        {TYPE_LABELS[c.type] ?? c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/app/klanten/${c.id}`} className="font-medium text-white hover:text-ck-red">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ck-muted-light">{c.city ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
