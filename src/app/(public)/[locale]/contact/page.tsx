'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

const SUBJECT_KEYS = [
  'damageRepair',
  'quoteRequest',
  'insuranceClaim',
  'paintWork',
  'dentRepair',
  'generalQuestion',
] as const;

export default function ContactPage() {
  const t = useTranslations('pub');
  const { locale } = useParams<{ locale: string }>();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('contact.requiredField');
    if (!form.email.trim()) e.email = t('contact.requiredField');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t('contact.invalidEmail');
    }
    if (!form.subject) e.subject = t('contact.requiredField');
    if (!form.message.trim()) e.message = t('contact.requiredField');
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.subject,
          message: form.message,
          locale: locale || 'nl',
        }),
      });
      if (!res.ok) throw new Error('failed');

      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
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

  const inputClasses =
    'mt-1 w-full border border-ck-border bg-ck-bg px-4 py-3 text-sm text-ck-text placeholder-ck-text-faint outline-none transition-colors focus:border-ck-red/50';

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            COLOURKING
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-ck-text sm:text-5xl lg:text-6xl">
            {t('contact.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-px bg-ck-border lg:grid-cols-5">
          <div className="flex flex-col gap-px bg-ck-border lg:col-span-3">
            <div className="bg-ck-bg p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t('contact.formTitle')}
              </h2>

              {status === 'success' ? (
                <div className="mt-8 border border-green-900/30 bg-green-950/20 p-6">
                  <p className="text-sm text-green-400">{t('contact.success')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Name, Email, Phone in one row */}
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('contact.name')} <span className="text-ck-red">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={inputClasses}
                      />
                      {errors.name && <p className="mt-1 text-xs text-ck-red">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('contact.email')} <span className="text-ck-red">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={inputClasses}
                      />
                      {errors.email && <p className="mt-1 text-xs text-ck-red">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('contact.phone')}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Subject dropdown */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      {t('contact.subject')} <span className="text-ck-red">*</span>
                    </label>
                    <select
                      id="subject"
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className={`${inputClasses} ${!form.subject ? 'text-ck-text-faint' : ''}`}
                    >
                      <option value="">{t('contact.subjectPlaceholder')}</option>
                      {SUBJECT_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {t(`contact.subjects.${key}`)}
                        </option>
                      ))}
                    </select>
                    {errors.subject && <p className="mt-1 text-xs text-ck-red">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      {t('contact.message')} <span className="text-ck-red">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className={`${inputClasses} resize-none`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-ck-red">{errors.message}</p>}
                  </div>

                  {status === 'error' && (
                    <p className="text-sm text-ck-red">{t('contact.error')}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-ck-red px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50"
                  >
                    {status === 'sending' ? t('contact.submitting') : t('contact.submit')}
                  </button>
                </form>
              )}
            </div>

            {/* Google Maps embed — below the form */}
            <div className="bg-ck-bg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2462.5!2d4.4869!3d51.8878!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4335e6ae3a8d7%3A0x0!2sSatijnbloem+6%2C+3068+JP+Rotterdam!5e0!3m2!1snl!2snl!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Colourking location"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-px bg-ck-border lg:col-span-2">
            {/* Contact details — first */}
            <div className="bg-ck-bg p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.address')}
                  </p>
                  <p className="mt-2 text-sm text-ck-text">{t('footer.address')}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.phone')}
                  </p>
                  <a
                    href="tel:+31681631020"
                    className="mt-2 block font-heading text-2xl font-bold text-ck-text transition-colors hover:text-ck-red"
                  >
                    {t('footer.phone')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.email')}
                  </p>
                  <a
                    href="mailto:info@colourking.nl"
                    className="mt-2 block text-sm text-ck-text transition-colors hover:text-ck-red"
                  >
                    {t('footer.email')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('footer.hours')}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-ck-text-muted">
                    <p>{t('footer.hoursWeekdays')}</p>
                    <p>{t('footer.hoursSaturday')}</p>
                    <p>{t('footer.hoursSunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Company Badge — second */}
            <div className="bg-ck-bg p-8 sm:p-12">
              <div className="border border-ck-border bg-ck-surface p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ck-red">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-sm font-bold uppercase tracking-wide text-ck-text">
                      {t('contact.verified.title')}
                    </p>
                    <span className="inline-block mt-0.5 rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                      {t('contact.verified.active')}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-ck-border pb-2">
                    <span className="text-ck-text-muted">{t('contact.verified.company')}</span>
                    <span className="font-medium text-ck-text">Autospuitbedrijf Colour King</span>
                  </div>
                  <div className="flex justify-between border-b border-ck-border pb-2">
                    <span className="text-ck-text-muted">KvK</span>
                    <span className="font-medium text-ck-text">82199884</span>
                  </div>
                  <div className="flex justify-between border-b border-ck-border pb-2">
                    <span className="text-ck-text-muted">BTW</span>
                    <span className="font-medium text-ck-text">NL821998840B03</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ck-text-muted">{t('contact.address')}</span>
                    <span className="font-medium text-ck-text text-right">Satijnbloem 6<br />3068 JP Rotterdam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
