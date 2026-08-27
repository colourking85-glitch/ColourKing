'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
};

export default function EditCustomerPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      type: fd.get('type') as string,
      name: fd.get('name') as string,
      email: fd.get('email') || null,
      phone: fd.get('phone') || null,
      address: fd.get('address') || null,
      postcode: fd.get('postcode') || null,
      city: fd.get('city') || null,
      btw_number: fd.get('btw_number') || null,
      locale: fd.get('locale') as string,
      notes: fd.get('notes') || null,
    };

    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/app/klanten/${id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  if (!customer) return <div className="p-8 text-center text-ck-muted">{tCommon('notFound')}</div>;

  const inputClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/app/klanten/${id}`} className="text-ck-muted hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <ScreenBadge code="KL03" />
        <h1 className="font-display text-2xl font-bold text-white">{t('editCustomer')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('type')}</label>
            <select name="type" defaultValue={customer.type} className={inputClass}>
              <option value="private">{t('private')}</option>
              <option value="company">{t('company')}</option>
              <option value="fleet">{t('fleet')}</option>
              <option value="dealer">{t('dealer')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('locale')}</label>
            <select name="locale" defaultValue={customer.locale} className={inputClass}>
              <option value="nl">{t('languageNl')}</option>
              <option value="en">{t('languageEn')}</option>
              <option value="tr">{t('languageTr')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('nameRequired')}</label>
          <input name="name" required defaultValue={customer.name} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('email')}</label>
            <input name="email" type="email" defaultValue={customer.email ?? ''} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('phone')}</label>
            <input name="phone" defaultValue={customer.phone ?? ''} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('address')}</label>
          <input name="address" defaultValue={customer.address ?? ''} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('postcode')}</label>
            <input name="postcode" defaultValue={customer.postcode ?? ''} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('city')}</label>
            <input name="city" defaultValue={customer.city ?? ''} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('vatNumber')}</label>
          <input name="btw_number" placeholder="NL..." defaultValue={customer.btw_number ?? ''} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('notes')}</label>
          <textarea name="notes" rows={3} defaultValue={customer.notes ?? ''} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-6 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-6 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
