'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Car, ClipboardCheck, PackageCheck, ChevronLeft, ChevronRight, Check, Clock, Calendar, User, Phone, Mail, FileText, Loader2 } from 'lucide-react';

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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kenteken, setKenteken] = useState('');
  const [notes, setNotes] = useState('');

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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 pt-24 pb-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <Check size={40} className="text-green-400" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('successTitle')}</h1>
          <p className="mt-4 text-white/60 leading-relaxed">{t('successMessage')}</p>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6 text-left">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">{t('type')}</span>
                <span className="font-medium text-white">{t(`types.${type}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{tCommon('date')}</span>
                <span className="font-medium text-white">
                  {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t('time')}</span>
                <span className="font-medium text-white">{time}</span>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 bg-[#E8364E] px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44]"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 pt-28 pb-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-white/50">{t('subtitle')}</p>
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
                    ? 'bg-[#E8364E] text-white shadow-lg shadow-[#E8364E]/30'
                    : step > s
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-white/30'
                }`}
              >
                {step > s ? <Check size={16} /> : s}
              </button>
              <span className={`hidden text-xs font-medium uppercase tracking-wide sm:block ${
                step === s ? 'text-white' : 'text-white/30'
              }`}>
                {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
              </span>
              {s < 3 && <div className={`mx-2 h-px w-8 ${step > s ? 'bg-green-500/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">{t('chooseType')}</h2>
            <div className="grid gap-3">
              {TYPES.map(({ value, icon: Icon, duration }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-4 rounded-lg border p-5 text-left transition-all ${
                    type === value
                      ? 'border-[#E8364E]/50 bg-[#E8364E]/10 shadow-lg shadow-[#E8364E]/5'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    type === value ? 'bg-[#E8364E]/20 text-[#E8364E]' : 'bg-white/5 text-white/40'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-base font-semibold ${type === value ? 'text-white' : 'text-white/80'}`}>
                      {t(`types.${value}`)}
                    </span>
                    <p className="mt-0.5 text-sm text-white/40">{t(`typeDesc.${value}`)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/30">
                    <Clock size={12} />
                    <span>±{duration} min</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="flex items-center gap-2 bg-[#E8364E] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44] disabled:opacity-30 disabled:cursor-not-allowed"
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
            <h2 className="text-lg font-semibold text-white">{t('chooseDateTime')}</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                <Calendar size={14} className="mr-1.5 inline" />
                {tCommon('date')}
              </label>
              <input
                type="date"
                value={date}
                min={minDateStr}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white [color-scheme:dark] focus:border-[#E8364E] focus:outline-none"
              />
            </div>

            {date && (
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  <Clock size={14} className="mr-1.5 inline" />
                  {t('time')}
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-4 text-white/40">
                    <Loader2 size={16} className="animate-spin" />
                    {tCommon('loading')}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="py-4 text-sm text-white/40">{t('noSlots')}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          time === slot.time
                            ? 'border-[#E8364E]/50 bg-[#E8364E]/20 text-[#E8364E]'
                            : slot.available
                              ? 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white'
                              : 'border-white/5 bg-white/[0.01] text-white/15 cursor-not-allowed line-through'
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
                className="flex items-center gap-2 border border-white/10 px-5 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white hover:border-white/30"
              >
                <ChevronLeft size={16} />
                {tCommon('back')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canGoStep3}
                className="flex items-center gap-2 bg-[#E8364E] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44] disabled:opacity-30 disabled:cursor-not-allowed"
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
            <h2 className="text-lg font-semibold text-white">{t('yourDetails')}</h2>

            {/* Summary */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={14} className="text-[#E8364E]" />
                  <span className="text-white/50">{t(`types.${type}`)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#E8364E]" />
                  <span className="text-white/50">
                    {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#E8364E]" />
                  <span className="text-white/50">{time}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/60">
                  <User size={14} className="mr-1.5 inline" />
                  {t('name')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-[#E8364E] focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/60">
                    <Phone size={14} className="mr-1.5 inline" />
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="06-12345678"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-[#E8364E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/60">
                    <Mail size={14} className="mr-1.5 inline" />
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-[#E8364E] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/60">
                  <Car size={14} className="mr-1.5 inline" />
                  {t('kenteken')}
                </label>
                <input
                  type="text"
                  value={kenteken}
                  onChange={e => setKenteken(e.target.value.toUpperCase())}
                  placeholder="AB-123-CD"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 font-mono uppercase text-white placeholder:text-white/20 focus:border-[#E8364E] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/60">
                  <FileText size={14} className="mr-1.5 inline" />
                  {t('notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t('notesPlaceholder')}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-[#E8364E] focus:outline-none resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 border border-white/10 px-5 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white hover:border-white/30"
              >
                <ChevronLeft size={16} />
                {tCommon('back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex items-center gap-2 bg-[#E8364E] px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44] disabled:opacity-30 disabled:cursor-not-allowed"
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
        <div className="mt-12 text-center text-xs text-white/30">
          <p>{t('openingHours')}</p>
        </div>
      </div>
    </div>
  );
}
