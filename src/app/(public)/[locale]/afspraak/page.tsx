'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Car, ClipboardCheck, PackageCheck, ChevronLeft, ChevronRight, Check, Clock, Calendar, User, Phone, Mail, FileText, Loader2, MapPin, Navigation } from 'lucide-react';

type Slot = { time: string; available: boolean };

const TYPES = [
  { value: 'inspection' as const, icon: ClipboardCheck, duration: 30 },
  { value: 'drop_off' as const, icon: Car, duration: 30 },
  { value: 'collection' as const, icon: PackageCheck, duration: 30 },
] as const;

type AppointmentType = typeof TYPES[number]['value'];

export default function BookingPage() {
  const t = useTranslations('pub.booking');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState(1);
  const [type, setType] = useState<AppointmentType | ''>('');
  const [location, setLocation] = useState<'shop' | 'other'>('shop');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kenteken, setKenteken] = useState('');
  const [notes, setNotes] = useState('');
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!date || !type) return;
    setLoadingSlots(true);
    setTime('');
    fetch(`/api/public/appointment-slots?date=${date}&type=${type}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Slot[]) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, type]);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          contact_name: name,
          contact_email: email || undefined,
          contact_phone: phone || undefined,
          kenteken: kenteken || undefined,
          scheduled_date: date,
          scheduled_time: time,
          location,
          location_address: location === 'other'
            ? [street, [postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || undefined
            : undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || t('submitError'));
      }
    } catch {
      setError(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  const canGoStep2 = !!type;
  const canGoStep3 = !!date && !!time;
  const canSubmit = !!name;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ck-bg px-6 pt-24 pb-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <Check size={40} className="text-green-400" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('successTitle')}</h1>
          <p className="mt-4 text-ck-text-muted leading-relaxed">{t('successMessage')}</p>
          <div className="mt-8 rounded-lg border border-ck-border bg-ck-surface-2 p-6 text-left">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ck-text-muted">{t('type')}</span>
                <span className="font-medium text-white">{t(`types.${type}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ck-text-muted">{tCommon('date')}</span>
                <span className="font-medium text-white">
                  {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ck-text-muted">{t('time')}</span>
                <span className="font-medium text-white">{time}</span>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 bg-ck-red px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ck-bg px-6 pt-28 pb-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold text-ck-text md:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-ck-text-muted">{t('subtitle')}</p>
        </div>

        {/* Step indicator */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s === 1) setStep(1);
                  if (s === 2 && canGoStep2) setStep(2);
                  if (s === 3 && canGoStep2 && canGoStep3) setStep(3);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step === s
                    ? 'bg-ck-red text-white shadow-lg shadow-ck-red/30'
                    : step > s
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-ck-surface-2 text-ck-text-faint'
                }`}
              >
                {step > s ? <Check size={16} /> : s}
              </button>
              <span className={`hidden text-xs font-medium uppercase tracking-wide sm:block ${
                step === s ? 'text-ck-text' : 'text-ck-text-faint'
              }`}>
                {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
              </span>
              {s < 3 && <div className={`mx-2 h-px w-8 ${step > s ? 'bg-green-500/40' : 'bg-ck-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ck-text">{t('chooseType')}</h2>
            <div className="grid gap-3">
              {TYPES.map(({ value, icon: Icon, duration }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-4 rounded-lg border p-5 text-left transition-all ${
                    type === value
                      ? 'border-ck-red/50 bg-ck-red/10 shadow-lg shadow-ck-red/5'
                      : 'border-ck-border bg-ck-surface-2 hover:border-ck-border-2 hover:bg-ck-surface-3'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    type === value ? 'bg-ck-red/20 text-ck-red' : 'bg-ck-surface-2 text-ck-text-faint'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-base font-semibold ${type === value ? 'text-ck-text' : 'text-ck-text-2'}`}>
                      {t(`types.${value}`)}
                    </span>
                    <p className="mt-0.5 text-sm text-ck-text-faint">{t(`typeDesc.${value}`)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ck-text-faint">
                    <Clock size={12} />
                    <span>±{duration} min</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Location */}
            <h2 className="mt-8 text-lg font-semibold text-ck-text">{t('location')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setLocation('shop')}
                className={`flex items-start gap-4 rounded-lg border p-5 text-left transition-all ${
                  location === 'shop'
                    ? 'border-ck-red/50 bg-ck-red/10 shadow-lg shadow-ck-red/5'
                    : 'border-ck-border bg-ck-surface-2 hover:border-ck-border-2 hover:bg-ck-surface-3'
                }`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  location === 'shop' ? 'bg-ck-red/20 text-ck-red' : 'bg-ck-surface-2 text-ck-text-faint'
                }`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <span className={`text-sm font-semibold uppercase tracking-wide ${location === 'shop' ? 'text-ck-red' : 'text-ck-text-muted'}`}>
                    {t('locationShop')}
                  </span>
                  <p className="mt-1 text-sm font-medium text-ck-text">Satijnbloem 6, 3068 JP</p>
                  <p className="text-xs text-ck-text-faint">Rotterdam · {t('freeParking')}</p>
                </div>
              </button>
              <button
                onClick={() => setLocation('other')}
                className={`flex items-start gap-4 rounded-lg border p-5 text-left transition-all ${
                  location === 'other'
                    ? 'border-ck-red/50 bg-ck-red/10 shadow-lg shadow-ck-red/5'
                    : 'border-ck-border bg-ck-surface-2 hover:border-ck-border-2 hover:bg-ck-surface-3'
                }`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  location === 'other' ? 'bg-ck-red/20 text-ck-red' : 'bg-ck-surface-2 text-ck-text-faint'
                }`}>
                  <Navigation size={20} />
                </div>
                <div>
                  <span className={`text-sm font-semibold uppercase tracking-wide ${location === 'other' ? 'text-ck-red' : 'text-ck-text-muted'}`}>
                    {t('locationOther')}
                  </span>
                  <p className="mt-1 text-sm font-medium text-ck-text">{t('locationOtherDesc')}</p>
                  <p className="text-xs text-ck-text-faint">{t('locationOtherHint')}</p>
                </div>
              </button>
            </div>

            {location === 'other' && (
              <div className="grid gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ck-text-muted">{t('street')}</label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder={t('streetPlaceholder')}
                    className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ck-text-muted">{t('postcode')}</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={e => setPostcode(e.target.value.toUpperCase())}
                      placeholder={t('postcodePlaceholder')}
                      className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ck-text-muted">{t('city')}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder={t('cityPlaceholder')}
                      className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-ck-text-faint">{t('stepOf', { step: 1, total: 3 })}</span>
              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="flex items-center gap-2 bg-ck-red px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('continue')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-ck-text">{t('chooseDateTime')}</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-ck-text-muted">
                <Calendar size={14} className="mr-1.5 inline" />
                {tCommon('date')}
              </label>
              <input
                type="date"
                value={date}
                min={minDateStr}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text focus:border-ck-red focus:outline-none"
              />
            </div>

            {date && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ck-text-muted">
                  <Clock size={14} className="mr-1.5 inline" />
                  {t('time')}
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-4 text-ck-text-faint">
                    <Loader2 size={16} className="animate-spin" />
                    {tCommon('loading')}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="py-4 text-sm text-ck-text-faint">{t('noSlots')}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          time === slot.time
                            ? 'border-ck-red/50 bg-ck-red/20 text-ck-red'
                            : slot.available
                              ? 'border-ck-border bg-ck-surface-2 text-ck-text-3 hover:border-ck-border-2 hover:text-ck-text'
                              : 'border-ck-border bg-ck-surface text-ck-text-faint cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 border border-ck-border px-5 py-3 text-sm font-medium text-ck-text-muted transition-colors hover:text-ck-text hover:border-ck-border-2"
              >
                <ChevronLeft size={16} />
                {tCommon('back')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canGoStep3}
                className="flex items-center gap-2 bg-ck-red px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('continue')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-ck-text">{t('yourDetails')}</h2>

            {/* Summary */}
            <div className="rounded-lg border border-ck-border bg-ck-surface-2 p-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={14} className="text-ck-red" />
                  <span className="text-ck-text-muted">{t(`types.${type}`)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-ck-red" />
                  <span className="text-ck-text-muted">
                    {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-ck-red" />
                  <span className="text-ck-text-muted">{time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-ck-red" />
                  <span className="text-ck-text-muted">{location === 'shop' ? t('locationShop') : t('locationOther')}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                  <User size={14} className="mr-1.5 inline" />
                  {t('name')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                    <Phone size={14} className="mr-1.5 inline" />
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="06-12345678"
                    className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                    <Mail size={14} className="mr-1.5 inline" />
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                  <Car size={14} className="mr-1.5 inline" />
                  {t('kenteken')}
                </label>
                <input
                  type="text"
                  value={kenteken}
                  onChange={e => setKenteken(e.target.value.toUpperCase())}
                  placeholder="AB-123-CD"
                  className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 font-mono uppercase text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                  <FileText size={14} className="mr-1.5 inline" />
                  {t('notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t('notesPlaceholder')}
                  className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 border border-ck-border px-5 py-3 text-sm font-medium text-ck-text-muted transition-colors hover:text-ck-text hover:border-ck-border-2"
              >
                <ChevronLeft size={16} />
                {tCommon('back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex items-center gap-2 bg-ck-red px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {t('submit')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-ck-text-faint">
          <p>{t('openingHours')}</p>
        </div>
      </div>
    </div>
  );
}
