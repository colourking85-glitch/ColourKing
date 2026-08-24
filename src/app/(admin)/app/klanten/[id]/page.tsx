'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Pencil, Trash2 } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Customer = {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  btw_number: string | null;
  locale: string;
  notes: string | null;
  created_at: string;
  vehicles?: Array<{
    id: string;
    kenteken: string | null;
    make: string | null;
    model: string | null;
    colour: string | null;
    year: number | null;
  }>;
};

const TYPE_LABELS: Record<string, string> = {
  private: 'Particulier',
  company: 'Bedrijf',
  fleet: 'Wagenpark',
  dealer: 'Dealer',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze klant wilt verwijderen?')) return;
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/klanten');
  }

  if (loading) return <div className="p-8 text-center text-ck-muted">Laden...</div>;
  if (!customer) return <div className="p-8 text-center text-ck-muted">Klant niet gevonden</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/klanten" className="text-ck-muted hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <ScreenBadge code="KL02" />
          <h1 className="font-display text-2xl font-bold text-white">{customer.name}</h1>
          <span className="rounded bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted">
            {TYPE_LABELS[customer.type]}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/klanten/${id}/bewerken`}
            className="flex items-center gap-2 rounded-lg border border-ck-dark-border px-3 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            <Pencil size={14} /> Bewerken
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Verwijderen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">Gegevens</h2>
          <dl className="space-y-3">
            <Row label="Email" value={customer.email} />
            <Row label="Telefoon" value={customer.phone} />
            <Row label="Adres" value={customer.address} />
            <Row label="Postcode" value={customer.postcode} />
            <Row label="Stad" value={customer.city} />
            <Row label="BTW-nummer" value={customer.btw_number} />
            <Row label="Taal" value={customer.locale?.toUpperCase()} />
            <Row label="Aangemaakt" value={new Date(customer.created_at).toLocaleDateString('nl-NL')} />
          </dl>
          {customer.notes && (
            <div className="mt-4 border-t border-ck-dark-border pt-4">
              <p className="text-xs text-ck-muted">Notities</p>
              <p className="mt-1 text-sm text-ck-muted-light">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-ck-muted">Voertuigen</h2>
            <Link
              href={`/app/voertuigen/nieuw?customer=${id}`}
              className="text-xs text-ck-red hover:text-ck-red-hover"
            >
              + Voertuig toevoegen
            </Link>
          </div>
          {!customer.vehicles?.length ? (
            <p className="text-sm text-ck-muted">Nog geen voertuigen</p>
          ) : (
            <div className="space-y-3">
              {customer.vehicles.map(v => (
                <Link
                  key={v.id}
                  href={`/app/voertuigen/${v.id}`}
                  className="flex items-center gap-3 rounded-lg border border-ck-dark-border p-3 hover:border-ck-muted/30"
                >
                  <Car size={18} className="text-ck-muted" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {v.kenteken ?? 'Geen kenteken'}
                    </p>
                    <p className="text-xs text-ck-muted">
                      {[v.make, v.model, v.year].filter(Boolean).join(' ') || 'Onbekend voertuig'}
                      {v.colour ? ` — ${v.colour}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-ck-muted">{label}</dt>
      <dd className="text-sm text-ck-muted-light">{value || '—'}</dd>
    </div>
  );
}
