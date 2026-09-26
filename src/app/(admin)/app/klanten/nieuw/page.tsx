'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

const CUSTOMER_TYPES = [
  'private','sme','corporate_fleet','lease_company','rental',
  'taxi_transport','dealer','bodyshop_partner','insurer',
  'insurance_intermediary','government',
] as const;

const LEGAL_FORMS = ['bv','nv','vof','eenmanszaak','stichting','cv','foreign','other'] as const;
const VAT_TREATMENTS = ['nl_standard','eu_reverse_charge','non_eu','exempt'] as const;
const STRATEGIC_VALUES = ['key','growth','maintain','exit'] as const;

export default function NewCustomerPage() {
  const t = useTranslations('kl');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customerType, setCustomerType] = useState<string>('private');

  const isBusiness = customerType !== 'private';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      type: fd.get('type') as string,
      name: fd.get('name') as string,
      locale: fd.get('locale') as string,
    };

    const optional = [
      'legal_name','trade_name','legal_form','email','phone','website',
      'address','postcode','city','country','kvk_number','vestigingsnummer',
      'btw_id','btw_number','vat_treatment','customer_since','description',
      'workshop_instructions','preferred_language','preferred_channel',
      'strategic_value','fleet_profile','typical_damage_profile','notes',
    ];
    for (const key of optional) {
      const val = fd.get(key);
      if (val) body[key] = val;
    }

    const fleetSize = fd.get('fleet_size');
    if (fleetSize) body.fleet_size = parseInt(fleetSize as string, 10) || null;

    const relationshipScore = fd.get('relationship_score_manual');
    if (relationshipScore) body.relationship_score_manual = parseInt(relationshipScore as string, 10) || null;

    const tags = (fd.get('tags') as string || '').split(',').map(s => s.trim()).filter(Boolean);
    if (tags.length > 0) body.tags = tags;

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const customer = await res.json();
      router.push(`/app/klanten/${customer.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';
  const labelClass = 'mb-1 block text-xs text-ck-muted';
  const sectionClass = 'space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6';
  const sectionTitleClass = 'text-sm font-semibold text-white mb-4';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="KL01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>{t('section_basic')}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('type')}</label>
              <select
                name="type"
                value={customerType}
                onChange={e => setCustomerType(e.target.value)}
                className={inputClass}
              >
                {CUSTOMER_TYPES.map(ct => (
                  <option key={ct} value={ct}>{t(ct as Parameters<typeof t>[0])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('locale')}</label>
              <select name="locale" defaultValue="nl" className={inputClass}>
                <option value="nl">{t('languageNl')}</option>
                <option value="en">{t('languageEn')}</option>
                <option value="tr">{t('languageTr')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('preferred_language')}</label>
              <select name="preferred_language" defaultValue="nl" className={inputClass}>
                <option value="nl">{t('languageNl')}</option>
                <option value="en">{t('languageEn')}</option>
                <option value="tr">{t('languageTr')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('nameRequired')}</label>
            <input name="name" required className={inputClass} />
          </div>

          {isBusiness && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('legal_name')}</label>
                <input name="legal_name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('trade_name')}</label>
                <input name="trade_name" className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{t('description')}</label>
            <textarea name="description" rows={2} className={inputClass} />
          </div>
        </div>

        {/* Contact Details */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>{t('section_contact')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('email')}</label>
              <input name="email" type="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('phone')}</label>
              <input name="phone" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('website')}</label>
              <input name="website" type="url" placeholder="https://" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('preferred_channel')}</label>
              <select name="preferred_channel" defaultValue="" className={inputClass}>
                <option value="">—</option>
                <option value="email">{t('email')}</option>
                <option value="phone">{t('phone')}</option>
                <option value="whatsapp">{t('whatsapp')}</option>
                <option value="portal">Portal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>{t('section_address')}</h2>
          <div>
            <label className={labelClass}>{t('address')}</label>
            <input name="address" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('postcode')}</label>
              <input name="postcode" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('city')}</label>
              <input name="city" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('country')}</label>
              <input name="country" defaultValue="NL" maxLength={2} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Identity & Compliance — only for business types */}
        {isBusiness && (
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>{t('section_identity')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('legal_form')}</label>
                <select name="legal_form" defaultValue="" className={inputClass}>
                  <option value="">—</option>
                  {LEGAL_FORMS.map(lf => (
                    <option key={lf} value={lf}>{t(lf as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('vat_treatment')}</label>
                <select name="vat_treatment" defaultValue="" className={inputClass}>
                  <option value="">—</option>
                  {VAT_TREATMENTS.map(vt => (
                    <option key={vt} value={vt}>{t(vt as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t('kvk_number')}</label>
                <input name="kvk_number" maxLength={8} placeholder="12345678" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('vestigingsnummer')}</label>
                <input name="vestigingsnummer" maxLength={12} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('btw_id')}</label>
                <input name="btw_id" placeholder="NL000000000B01" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('vatNumber')}</label>
              <input name="btw_number" placeholder="NL..." className={inputClass} />
            </div>
          </div>
        )}

        {/* Business */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>{t('section_business')}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('customer_since')}</label>
              <input name="customer_since" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('strategic_value')}</label>
              <select name="strategic_value" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {STRATEGIC_VALUES.map(sv => (
                  <option key={sv} value={sv}>{t(sv === 'exit' ? 'exit_val' : sv as Parameters<typeof t>[0])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('relationship_score')}</label>
              <select name="relationship_score_manual" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
          </div>

          {isBusiness && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('fleet_size')}</label>
                <input name="fleet_size" type="number" min={0} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('fleet_profile')}</label>
                <input name="fleet_profile" className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{t('tags')}</label>
            <input name="tags" placeholder="VIP, fleet, premium" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('workshop_instructions')}</label>
            <textarea name="workshop_instructions" rows={2} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('notes')}</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
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
