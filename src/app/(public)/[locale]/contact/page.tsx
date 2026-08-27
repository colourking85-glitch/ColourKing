'use client';

import { useState, useRef, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

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
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('contact.requiredField');
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
      const { id: leadId } = await res.json();

      if (files.length > 0 && leadId) {
        const fd = new FormData();
        fd.append('lead_id', leadId);
        for (const f of files) fd.append('files', f);
        await fetch('/api/public/lead-photos', { method: 'POST', body: fd });
      }

      setStatus('success');
      setForm({ name: '', email: '', phone: '', kenteken: '', damage: '' });
      setFiles([]);
    } catch {
      setStatus('error');
    }
  }

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files];
    for (let i = 0; i < selected.length && next.length < MAX_FILES; i++) {
      const f = selected[i];
      if (f.type && !f.type.startsWith('image/')) continue;
      next.push(f);
    }
    const total = next.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      alert(t('contact.filesTooLarge'));
      return;
    }
    setFiles(next);
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
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
    'mt-1 w-full border border-ck-border bg-ck-dark px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[#E8364E]/50';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('cta.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('contact.formTitle')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
            {t('cta.subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-px bg-ck-border lg:grid-cols-5">
          {/* Form */}
          <div className="bg-ck-dark p-8 sm:p-12 lg:col-span-3">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
              {t('contact.formTitle')}
            </h2>

            {status === 'success' ? (
              <div className="mt-8 border border-green-900/30 bg-green-950/20 p-6">
                <p className="text-sm text-green-400">{t('contact.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t('contact.name')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={inputClasses}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-[#E8364E]">{errors.name}</p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                      {t('contact.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={inputClasses}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-[#E8364E]">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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

                <div>
                  <label htmlFor="kenteken" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t('contact.kenteken')}
                  </label>
                  <input
                    id="kenteken"
                    type="text"
                    value={form.kenteken}
                    onChange={(e) => handleChange('kenteken', e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="damage" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t('contact.damageDescription')}
                  </label>
                  <textarea
                    id="damage"
                    rows={5}
                    value={form.damage}
                    onChange={(e) => handleChange('damage', e.target.value)}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t('contact.photos')} ({files.length}/{MAX_FILES})
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="group relative h-20 w-20 overflow-hidden border border-ck-border">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute right-0 top-0 bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-20 w-20 items-center justify-center border border-dashed border-white/20 text-white/30 transition-colors hover:border-[#E8364E]/50 hover:text-[#E8364E]"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                  />
                  <p className="mt-1 text-[10px] text-white/30">{t('contact.photosHint')}</p>
                </div>

                {status === 'error' && (
                  <p className="text-sm text-[#E8364E]">{t('contact.error')}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-[#E8364E] px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44] disabled:opacity-50"
                >
                  {status === 'sending' ? t('contact.submitting') : t('contact.submit')}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-px bg-ck-border lg:col-span-2">
            <div className="bg-ck-dark p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.infoTitle')}
                  </p>
                  <p className="mt-2 text-sm text-white">{t('footer.address')}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.phone')}
                  </p>
                  <a
                    href="tel:+31681631020"
                    className="mt-2 block font-heading text-2xl font-bold text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('footer.phone')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.email')}
                  </p>
                  <a
                    href="mailto:info@colourking.nl"
                    className="mt-2 block text-sm text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('footer.email')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('footer.hours')}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-white/60">
                    <p>{t('footer.hoursWeekdays')}</p>
                    <p>{t('footer.hoursSaturday')}</p>
                    <p>{t('footer.hoursSunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="flex h-48 items-center justify-center bg-ck-dark lg:flex-1">
              <p className="text-xs text-white/30">{t('contact.mapPlaceholder')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
