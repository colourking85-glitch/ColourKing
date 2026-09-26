'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Car, Pencil, Trash2, User, Building2, Truck, Store,
  Shield, Phone, MapPin, CreditCard, FileText, Bell, StickyNote,
  Activity, AlertTriangle, Star, CheckCircle, XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { AssignVehicle } from '@/components/customers/AssignVehicle';

type Vehicle = { id: string; kenteken?: string; make?: string; model?: string; colour?: string; year?: number; status?: string };
type Contact = { id: string; first_name: string; last_name: string; role?: string; phone?: string; mobile?: string; whatsapp?: string; email?: string; is_primary?: boolean; notes?: string; active?: boolean };
type Address = { id: string; type: string; street?: string; house_no?: string; addition?: string; postal_code?: string; city?: string; country?: string; is_default?: boolean };
type Billing = { id: string; customer_id: string; payment_terms_days?: number; invoicing_mode?: string; po_required?: boolean; peppol_id?: string; portal_upload_url?: string; invoice_email?: string; iban?: string; credit_limit_eur?: number; credit_hold?: boolean; credit_hold_reason?: string; credit_hold_since?: string; external_credit_rating?: string; external_credit_source?: string; external_credit_date?: string };
type InsuranceRelation = { id: string; party_type: string; party_customer_id?: string; party_name?: string; default_payer?: string; notes?: string; party?: { id: string; name: string; type: string } };
type Consent = { id: string; channel: string; purpose: string; basis: string; granted_at?: string; withdrawn_at?: string; source?: string };
type Note = { id: string; body: string; pinned?: boolean; created_at?: string };
type ActivityRecord = { id: string; type: string; occurred_at?: string; summary: string; ref_table?: string; ref_id?: string };

type CustomerData = {
  id: string; name: string; type: string; status: string;
  customer_no?: string; legal_name?: string; trade_name?: string;
  legal_form?: string; email?: string; phone?: string;
  address?: string; postcode?: string; city?: string; country?: string;
  kvk_number?: string; vestigingsnummer?: string; btw_id?: string; btw_number?: string;
  vat_treatment?: string; website?: string; customer_since?: string;
  account_manager_id?: string; description?: string; workshop_instructions?: string;
  tags?: string[]; preferred_language?: string; preferred_channel?: string;
  fleet_size?: number; fleet_profile?: string; typical_damage_profile?: string;
  strategic_value?: string; relationship_score_manual?: number;
  locale: string; notes?: string; created_at: string;
  vehicles?: Vehicle[];
};

type Customer360 = {
  customer: CustomerData;
  contacts: Contact[];
  addresses: Address[];
  billing: Billing | null;
  agreements: Array<Record<string, unknown>>;
  insurance_relations: InsuranceRelation[];
  consents: Consent[];
  notes: Note[];
  activities: ActivityRecord[];
};

const TABS = [
  'overview', 'contacts', 'addresses', 'billing', 'insurance',
  'consents', 'notes', 'activities', 'vehicles',
] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, typeof User> = {
  overview: User,
  contacts: Phone,
  addresses: MapPin,
  billing: CreditCard,
  insurance: Shield,
  consents: Bell,
  notes: StickyNote,
  activities: Activity,
  vehicles: Car,
};

const STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  active: 'bg-green-900/30 text-green-400 border-green-500/30',
  suspended: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  blocked: 'bg-red-900/30 text-red-400 border-red-500/30',
  ended: 'bg-gray-700/30 text-gray-400 border-gray-500/30',
  inactive: 'bg-gray-700/30 text-gray-400 border-gray-500/30',
};

const TYPE_ICONS: Record<string, typeof User> = {
  private: User, sme: Building2, corporate_fleet: Truck, lease_company: Building2,
  rental: Car, taxi_transport: Truck, dealer: Store, bodyshop_partner: Store,
  insurer: Shield, insurance_intermediary: Shield, government: Building2,
  company: Building2, fleet: Truck,
};

const CUSTOMER_STATUSES = ['prospect', 'active', 'suspended', 'blocked', 'ended'] as const;

export default function CustomerDetailPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/customers/${id}/full-profile`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return;
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/klanten');
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok && data) {
      setData({ ...data, customer: { ...data.customer, status: newStatus } });
    }
  }

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  if (!data) return <div className="p-8 text-center text-ck-muted">{tCommon('notFound')}</div>;

  const c = data.customer;
  const TypeIcon = TYPE_ICONS[c.type] ?? User;
  const typeLabel = t(c.type as Parameters<typeof t>[0]) || c.type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/klanten" className="text-ck-muted hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <ScreenBadge code="KL02" />
          <h1 className="font-display text-2xl font-bold text-white">{c.name}</h1>
          <span className="flex items-center gap-1.5 rounded bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted">
            <TypeIcon size={12} /> {typeLabel}
          </span>
          {c.customer_no && (
            <span className="rounded bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted">
              {c.customer_no}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/klanten/${id}/bewerken`}
            className="flex items-center gap-2 rounded-lg border border-ck-dark-border px-3 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            <Pencil size={14} /> {tCommon('edit')}
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> {tCommon('delete')}
          </button>
        </div>
      </div>

      {/* Status + Credit Hold Warning */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-3">
          <div className="flex gap-2">
            {CUSTOMER_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  c.status === s
                    ? STATUS_COLORS[s]
                    : 'border-ck-dark-border text-ck-muted hover:text-white hover:border-ck-muted/50'
                }`}
              >
                {t(`status_${s}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>
        {data.billing?.credit_hold && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-400">
            <AlertTriangle size={14} />
            {t('credit_hold_active')}
          </div>
        )}
        {c.strategic_value && (
          <div className="flex items-center gap-2 rounded bg-ck-dark-surface px-2 py-1 text-xs text-ck-muted">
            <Star size={12} className="text-yellow-400" />
            {t(c.strategic_value as Parameters<typeof t>[0])}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-ck-dark-border pb-px">
        {TABS.map(tab => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                activeTab === tab
                  ? 'border-ck-red text-white'
                  : 'border-transparent text-ck-muted hover:text-white'
              }`}
            >
              <Icon size={14} />
              {t(`tab_${tab}` as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} t={t} tCommon={tCommon} onReload={load} />}
      {activeTab === 'contacts' && <ContactsTab contacts={data.contacts} t={t} id={id} onReload={load} />}
      {activeTab === 'addresses' && <AddressesTab addresses={data.addresses} t={t} id={id} onReload={load} />}
      {activeTab === 'billing' && <BillingTab billing={data.billing} t={t} id={id} onReload={load} />}
      {activeTab === 'insurance' && <InsuranceTab relations={data.insurance_relations} t={t} />}
      {activeTab === 'consents' && <ConsentsTab consents={data.consents} t={t} />}
      {activeTab === 'notes' && <NotesTab notesList={data.notes} t={t} id={id} onReload={load} />}
      {activeTab === 'activities' && <ActivitiesTab activities={data.activities} t={t} />}
      {activeTab === 'vehicles' && <VehiclesTab vehicles={data.customer.vehicles ?? []} t={t} tCommon={tCommon} id={id} onReload={load} />}
    </div>
  );
}

/* ─── Shared ─── */

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-1">
      <dt className="text-sm text-ck-muted">{label}</dt>
      <dd className="text-sm text-ck-muted-light">{value ?? '—'}</dd>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-ck-muted">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Overview Tab ─── */

function OverviewTab({ data, t, tCommon, onReload }: { data: Customer360; t: ReturnType<typeof useTranslations<'kl'>>; tCommon: ReturnType<typeof useTranslations<'common'>>; onReload: () => void }) {
  const c = data.customer;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title={t('contact_info')}>
        <dl className="space-y-1">
          <Row label={t('email')} value={c.email} />
          <Row label={t('phone')} value={c.phone} />
          <Row label={t('website')} value={c.website} />
          <Row label={t('preferred_language')} value={c.preferred_language?.toUpperCase()} />
          <Row label={t('preferred_channel')} value={c.preferred_channel} />
          <Row label={t('address')} value={[c.address, c.postcode, c.city].filter(Boolean).join(', ') || undefined} />
        </dl>
      </Card>

      <Card title={t('identity_compliance')}>
        <dl className="space-y-1">
          <Row label={t('legal_name')} value={c.legal_name} />
          <Row label={t('trade_name')} value={c.trade_name} />
          <Row label={t('legal_form')} value={c.legal_form} />
          <Row label={t('kvk_number')} value={c.kvk_number} />
          <Row label={t('vestigingsnummer')} value={c.vestigingsnummer} />
          <Row label={t('btw_id')} value={c.btw_id || c.btw_number} />
          <Row label={t('vatNumber')} value={c.btw_number} />
        </dl>
      </Card>

      <Card title={t('relationship')}>
        <dl className="space-y-1">
          <Row label={t('customer_since')} value={c.customer_since ? new Date(c.customer_since).toLocaleDateString('nl-NL') : undefined} />
          <Row label={t('strategic_value')} value={c.strategic_value ? t(c.strategic_value as Parameters<typeof t>[0]) : undefined} />
          <Row label={t('fleet_size')} value={c.fleet_size} />
          <Row label={tCommon('create')} value={new Date(c.created_at).toLocaleDateString('nl-NL')} />
        </dl>
        {c.description && (
          <div className="mt-3 border-t border-ck-dark-border pt-3">
            <p className="text-xs text-ck-muted">{t('description')}</p>
            <p className="mt-1 text-sm text-ck-muted-light">{c.description}</p>
          </div>
        )}
        {c.workshop_instructions && (
          <div className="mt-3 border-t border-ck-dark-border pt-3">
            <p className="text-xs text-ck-muted">{t('workshop_instructions')}</p>
            <p className="mt-1 text-sm text-ck-muted-light">{c.workshop_instructions}</p>
          </div>
        )}
        {c.tags && c.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {c.tags.map(tag => (
              <span key={tag} className="rounded-full bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted">{tag}</span>
            ))}
          </div>
        )}
      </Card>

      <Card title={t('tab_vehicles')} action={
        <div className="flex items-center gap-4">
          <AssignVehicle customerId={c.id} onAssigned={onReload} />
          <Link href={`/app/voertuigen/nieuw?customer=${c.id}`} className="text-xs text-ck-red hover:text-ck-red-hover">
            {t('addVehicle')}
          </Link>
        </div>
      }>
        {!c.vehicles?.length ? (
          <p className="text-sm text-ck-muted">{t('noVehicles')}</p>
        ) : (
          <div className="space-y-2">
            {c.vehicles.slice(0, 5).map(v => (
              <Link key={v.id} href={`/app/voertuigen/${v.id}`} className="flex items-center gap-3 rounded-lg border border-ck-dark-border p-2 hover:border-ck-muted/30">
                <Car size={16} className="text-ck-muted" />
                <div>
                  <p className="text-sm font-medium text-white">{v.kenteken ?? tCommon('noRegistration')}</p>
                  <p className="text-xs text-ck-muted">{[v.make, v.model, v.year].filter(Boolean).join(' ')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── Contacts Tab ─── */

function ContactsTab({ contacts, t, id, onReload }: { contacts: Contact[]; t: ReturnType<typeof useTranslations<'kl'>>; id: string; onReload: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', role: 'other', email: '', phone: '', mobile: '' });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/customers/${id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setAdding(false); setForm({ first_name: '', last_name: '', role: 'other', email: '', phone: '', mobile: '' }); onReload(); }
  }

  return (
    <Card title={t('tab_contacts')} action={
      <button onClick={() => setAdding(!adding)} className="text-xs text-ck-red hover:text-ck-red-hover">{t('add_contact')}</button>
    }>
      {adding && (
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <input placeholder={t('first_name')} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('last_name')} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('mobile')} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white">
            {['fleet_manager','damage_coordinator','accounts_payable','signatory','procurement','driver_support','driver','other'].map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded px-3 py-1.5 text-sm text-ck-muted hover:text-white">Cancel</button>
            <button type="submit" className="rounded bg-ck-red px-3 py-1.5 text-sm text-white hover:bg-ck-red-hover">Save</button>
          </div>
        </form>
      )}
      {contacts.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_contacts')}</p>
      ) : (
        <div className="space-y-3">
          {contacts.map(ct => (
            <div key={ct.id} className="flex items-center justify-between rounded-lg border border-ck-dark-border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{ct.first_name} {ct.last_name}</p>
                  {ct.is_primary && <CheckCircle size={12} className="text-green-400" />}
                </div>
                <p className="text-xs text-ck-muted">{(ct.role ?? '').replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right text-xs text-ck-muted-light">
                {ct.email && <p>{ct.email}</p>}
                {ct.phone && <p>{ct.phone}</p>}
                {ct.mobile && <p>{ct.mobile}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Addresses Tab ─── */

function AddressesTab({ addresses, t, id, onReload }: { addresses: Address[]; t: ReturnType<typeof useTranslations<'kl'>>; id: string; onReload: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: 'registered', street: '', house_no: '', postal_code: '', city: '', country: 'NL' });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/customers/${id}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setAdding(false); setForm({ type: 'registered', street: '', house_no: '', postal_code: '', city: '', country: 'NL' }); onReload(); }
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { registered: t('registered'), invoice: t('invoice_addr'), pickup_delivery: t('pickup_delivery') };
    return map[type] || type;
  };

  return (
    <Card title={t('tab_addresses')} action={
      <button onClick={() => setAdding(!adding)} className="text-xs text-ck-red hover:text-ck-red-hover">{t('add_address')}</button>
    }>
      {adding && (
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white">
            <option value="registered">{t('registered')}</option>
            <option value="invoice">{t('invoice_addr')}</option>
            <option value="pickup_delivery">{t('pickup_delivery')}</option>
          </select>
          <input placeholder={t('street')} value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('house_no')} value={form.house_no} onChange={e => setForm(f => ({ ...f, house_no: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('postal_code')} value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('city')} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <input placeholder={t('country')} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="rounded border border-ck-dark-border bg-ck-dark-card px-3 py-2 text-sm text-white" />
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded px-3 py-1.5 text-sm text-ck-muted hover:text-white">Cancel</button>
            <button type="submit" className="rounded bg-ck-red px-3 py-1.5 text-sm text-white hover:bg-ck-red-hover">Save</button>
          </div>
        </form>
      )}
      {addresses.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_addresses')}</p>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className="flex items-center justify-between rounded-lg border border-ck-dark-border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-ck-dark-surface px-1.5 py-0.5 text-xs text-ck-muted">{typeLabel(addr.type)}</span>
                  {addr.is_default && <CheckCircle size={12} className="text-green-400" />}
                </div>
                <p className="mt-1 text-sm text-white">
                  {[addr.street, addr.house_no, addr.addition].filter(Boolean).join(' ')}
                </p>
                <p className="text-xs text-ck-muted">{[addr.postal_code, addr.city, addr.country].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Billing Tab ─── */

function BillingTab({ billing, t, id, onReload }: { billing: Billing | null; t: ReturnType<typeof useTranslations<'kl'>>; id: string; onReload: () => void }) {
  const b = billing;

  async function toggleCreditHold() {
    await fetch(`/api/customers/${id}/credit-hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credit_hold: !b?.credit_hold }),
    });
    onReload();
  }

  const modeLabel = (m: string | undefined) => {
    if (!m) return '—';
    const map: Record<string, string> = { per_job: t('per_job'), weekly_collective: t('weekly_collective'), monthly_collective: t('monthly_collective') };
    return map[m] || m;
  };

  return (
    <Card title={t('tab_billing')}>
      {!b ? (
        <p className="text-sm text-ck-muted">{t('no_billing')}</p>
      ) : (
        <div className="space-y-4">
          <dl className="space-y-1">
            <Row label={t('payment_terms')} value={b.payment_terms_days ? `${b.payment_terms_days} ${t('days')}` : undefined} />
            <Row label={t('invoicing_mode')} value={modeLabel(b.invoicing_mode)} />
            <Row label={t('po_required')} value={b.po_required ? t('yes_val') : t('no_val')} />
            <Row label={t('invoice_email')} value={b.invoice_email} />
            <Row label={t('iban')} value={b.iban} />
            <Row label={t('peppol_id')} value={b.peppol_id} />
            <Row label={t('credit_limit')} value={b.credit_limit_eur ? `€${(b.credit_limit_eur / 100).toFixed(2)}` : undefined} />
          </dl>
          <div className="flex items-center gap-3 border-t border-ck-dark-border pt-4">
            <button
              onClick={toggleCreditHold}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                b.credit_hold
                  ? 'border-red-500/30 bg-red-900/20 text-red-400 hover:bg-red-900/40'
                  : 'border-ck-dark-border text-ck-muted hover:text-white'
              }`}
            >
              {b.credit_hold ? <XCircle size={14} /> : <AlertTriangle size={14} />}
              {t('credit_hold')}
            </button>
            {b.credit_hold && b.credit_hold_reason && (
              <span className="text-xs text-red-400">{b.credit_hold_reason}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── Insurance Tab ─── */

function InsuranceTab({ relations, t }: { relations: InsuranceRelation[]; t: ReturnType<typeof useTranslations<'kl'>> }) {
  return (
    <Card title={t('tab_insurance')}>
      {relations.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_insurance')}</p>
      ) : (
        <div className="space-y-3">
          {relations.map(r => (
            <div key={r.id} className="rounded-lg border border-ck-dark-border p-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-ck-dark-surface px-1.5 py-0.5 text-xs text-ck-muted">{(r.party_type ?? '').replace(/_/g, ' ')}</span>
                <span className="text-xs text-ck-muted">{(r.default_payer ?? '').replace(/_/g, ' ')}</span>
              </div>
              <p className="mt-1 text-sm text-white">{r.party_name || r.party?.name || '—'}</p>
              {r.notes && <p className="mt-1 text-xs text-ck-muted">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Consents Tab ─── */

function ConsentsTab({ consents, t }: { consents: Consent[]; t: ReturnType<typeof useTranslations<'kl'>> }) {
  return (
    <Card title={t('tab_consents')}>
      {consents.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_consents')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border text-left text-xs uppercase text-ck-muted">
              <th className="px-3 py-2">{t('consent_channel')}</th>
              <th className="px-3 py-2">{t('consent_purpose')}</th>
              <th className="px-3 py-2">{t('consent_basis')}</th>
              <th className="px-3 py-2">{t('consent_granted')}</th>
              <th className="px-3 py-2">{t('consent_withdrawn')}</th>
            </tr>
          </thead>
          <tbody>
            {consents.map(c => (
              <tr key={c.id} className="border-b border-ck-dark-border/50">
                <td className="px-3 py-2 text-white">{c.channel}</td>
                <td className="px-3 py-2 text-ck-muted-light">{(c.purpose ?? '').replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-ck-muted-light">{(c.basis ?? '').replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-ck-muted-light">{c.granted_at ? new Date(c.granted_at).toLocaleDateString('nl-NL') : '—'}</td>
                <td className="px-3 py-2">
                  {c.withdrawn_at
                    ? <span className="text-red-400">{new Date(c.withdrawn_at).toLocaleDateString('nl-NL')}</span>
                    : <span className="text-green-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ─── Notes Tab ─── */

function NotesTab({ notesList, t, id, onReload }: { notesList: Note[]; t: ReturnType<typeof useTranslations<'kl'>>; id: string; onReload: () => void }) {
  const [body, setBody] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await fetch(`/api/customers/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (res.ok) { setBody(''); onReload(); }
  }

  return (
    <Card title={t('tab_notes')}>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t('add_note')}
          className="flex-1 rounded border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="rounded bg-ck-red px-3 py-2 text-sm text-white hover:bg-ck-red-hover">+</button>
      </form>
      {notesList.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_notes')}</p>
      ) : (
        <div className="space-y-2">
          {notesList.map(n => (
            <div key={n.id} className="rounded-lg border border-ck-dark-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">{n.body}</p>
                {n.pinned && <Star size={12} className="text-yellow-400" />}
              </div>
              <p className="mt-1 text-xs text-ck-muted">{n.created_at ? new Date(n.created_at).toLocaleString('nl-NL') : ''}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Activities Tab ─── */

function ActivitiesTab({ activities, t }: { activities: ActivityRecord[]; t: ReturnType<typeof useTranslations<'kl'>> }) {
  return (
    <Card title={t('tab_activities')}>
      {activities.length === 0 ? (
        <p className="text-sm text-ck-muted">{t('no_activities')}</p>
      ) : (
        <div className="space-y-2">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-ck-dark-border p-3">
              <span className="mt-0.5 rounded bg-ck-dark-surface px-1.5 py-0.5 text-xs text-ck-muted">{a.type}</span>
              <div className="flex-1">
                <p className="text-sm text-white">{a.summary}</p>
                <p className="text-xs text-ck-muted">{a.occurred_at ? new Date(a.occurred_at).toLocaleString('nl-NL') : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Vehicles Tab ─── */

function VehiclesTab({ vehicles, t, tCommon, id, onReload }: { vehicles: Vehicle[]; t: ReturnType<typeof useTranslations<'kl'>>; tCommon: ReturnType<typeof useTranslations<'common'>>; id: string; onReload: () => void }) {
  return (
    <Card title={t('tab_vehicles')} action={
      <div className="flex items-center gap-4">
        <AssignVehicle customerId={id} onAssigned={onReload} />
        <Link href={`/app/voertuigen/nieuw?customer=${id}`} className="text-xs text-ck-red hover:text-ck-red-hover">
          {t('addVehicle')}
        </Link>
      </div>
    }>
      {!vehicles.length ? (
        <p className="text-sm text-ck-muted">{t('noVehicles')}</p>
      ) : (
        <div className="space-y-2">
          {vehicles.map(v => (
            <Link key={v.id} href={`/app/voertuigen/${v.id}`} className="flex items-center gap-3 rounded-lg border border-ck-dark-border p-3 hover:border-ck-muted/30">
              <Car size={18} className="text-ck-muted" />
              <div>
                <p className="text-sm font-medium text-white">{v.kenteken ?? tCommon('noRegistration')}</p>
                <p className="text-xs text-ck-muted">
                  {[v.make, v.model, v.year].filter(Boolean).join(' ') || t('unknownVehicle')}
                  {v.colour ? ` — ${v.colour}` : ''}
                </p>
              </div>
              {v.status && <span className="ml-auto rounded bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted">{v.status}</span>}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
