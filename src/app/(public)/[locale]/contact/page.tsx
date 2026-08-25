'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ContactPage() {
  const t = useTranslations('pub');
  const { locale } = useParams<{ locale: string }>();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    kenteken: '',
    damage: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('contact.required');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t('contact.invalidEmail');
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/public/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          kenteken: form.kenteken || undefined,
          damage: form.damage || undefined,
          locale: locale || 'nl',
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', kenteken: '', damage: '' });
    } catch {
      setStatus('error');
    }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <>
      {/* Header */}
      <section className="px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-medium text-white sm:text-4xl">
            {t('contact.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b80]">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 sm:p-8">
              <h2 className="text-lg font-medium text-white">
                {t('contact.formTitle')}
              </h2>

              {status === 'success' ? (
                <div className="mt-6 rounded-[10px] border border-green-900/30 bg-green-950/20 p-4">
                  <p className="text-sm text-green-400">{t('contact.success')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm text-[#6b6b80]">
                      {t('contact.name')} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="mt-1 w-full rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-2.5 text-sm text-white placeholder-[#3a3a50] outline-none transition-colors focus:border-[#E8364E]/50"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-[#E8364E]">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm text-[#6b6b80]">
                      {t('contact.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="mt-1 w-full rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-2.5 text-sm text-white placeholder-[#3a3a50] outline-none transition-colors focus:border-[#E8364E]/50"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-[#E8364E]">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm text-[#6b6b80]">
                      {t('contact.phone')}
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="mt-1 w-full rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-2.5 text-sm text-white placeholder-[#3a3a50] outline-none transition-colors focus:border-[#E8364E]/50"
                    />
                  </div>

                  {/* Kenteken */}
                  <div>
                    <label htmlFor="kenteken" className="block text-sm text-[#6b6b80]">
                      {t('contact.kenteken')}
                    </label>
                    <input
                      id="kenteken"
                      type="text"
                      value={form.kenteken}
                      onChange={(e) => handleChange('kenteken', e.target.value)}
                      className="mt-1 w-full rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-2.5 text-sm text-white placeholder-[#3a3a50] outline-none transition-colors focus:border-[#E8364E]/50"
                    />
                  </div>

                  {/* Damage description */}
                  <div>
                    <label htmlFor="damage" className="block text-sm text-[#6b6b80]">
                      {t('contact.damage')}
                    </label>
                    <textarea
                      id="damage"
                      rows={4}
                      value={form.damage}
                      onChange={(e) => handleChange('damage', e.target.value)}
                      className="mt-1 w-full resize-none rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-2.5 text-sm text-white placeholder-[#3a3a50] outline-none transition-colors focus:border-[#E8364E]/50"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-sm text-[#E8364E]">{t('contact.error')}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full rounded-[10px] bg-[#E8364E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d02e44] disabled:opacity-50"
                  >
                    {status === 'sending' ? t('contact.sending') : t('contact.submit')}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 sm:p-8">
              <h2 className="text-lg font-medium text-white">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-6 space-y-5">
                {/* Address */}
                <div>
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">
                    {t('contact.address')}
                  </p>
                  <p className="mt-1 text-sm text-white">{t('contact.addressValue')}</p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">
                    {t('contact.phone')}
                  </p>
                  <a
                    href="tel:+31681631020"
                    className="mt-1 block text-sm text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('contact.phoneValue')}
                  </a>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">
                    {t('contact.email')}
                  </p>
                  <a
                    href="mailto:info@colourking.nl"
                    className="mt-1 block text-sm text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('contact.emailValue')}
                  </a>
                </div>

                {/* Hours */}
                <div>
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">
                    {t('contact.hours')}
                  </p>
                  <div className="mt-1 space-y-1 text-sm text-white">
                    <p>{t('contact.hoursWeekday')}</p>
                    <p>{t('contact.hoursSat')}</p>
                    <p>{t('contact.hoursSun')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mt-4 flex h-48 items-center justify-center rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
              <p className="text-xs text-[#6b6b80]">{t('contact.mapPlaceholder')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
