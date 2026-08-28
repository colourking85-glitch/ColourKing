'use client';

import { useState, useEffect, useMemo } from 'react';
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

const DAY_NAMES_NL = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function CalendarGrid({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 35);
    return d;
  }, [today]);

  const [viewMonth, setViewMonth] = useState(() => tomorrow.getMonth());
  const [viewYear, setViewYear] = useState(() => tomorrow.getFullYear());

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDow = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(viewYear, viewMonth, 1 - startDow);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }

    const lastRow = days.slice(35);
    const needsSixRows = lastRow.some(d => d.getMonth() === viewMonth);
    return needsSixRows ? days : days.slice(0, 35);
  }, [viewMonth, viewYear]);

  const canGoBack = viewMonth !== tomorrow.getMonth() || viewYear !== tomorrow.getFullYear();
  const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
  const canGoForward = nextMonthDate <= maxDate;

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  function goBack() {
    if (!canGoBack) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goForward() {
    if (!canGoForward) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const selectedObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;

  return (
    <div className="rounded-xl border border-ck-border bg-ck-surface-2 p-5">
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ck-text-muted transition-colors hover:bg-ck-surface-3 hover:text-ck-text disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold capitalize text-ck-text">{monthName}</span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ck-text-muted transition-colors hover:bg-ck-surface-3 hover:text-ck-text disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {DAY_NAMES_NL.map(d => (
          <div key={d} className="py-1 text-xs font-semibold uppercase tracking-wider text-ck-text-faint">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const inMonth = day.getMonth() === viewMonth;
          const isPast = day < tomorrow;
          const isTooFar = day > maxDate;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const disabled = !inMonth || isPast || isTooFar || isWeekend;
          const isToday = isSameDay(day, today);
          const isSelected = selectedObj && isSameDay(day, selectedObj);
          const ymd = formatYMD(day);

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(ymd)}
              className={`relative flex h-11 items-center justify-center text-sm font-medium transition-all ${
                isSelected
                  ? 'rounded-lg bg-ck-red text-white shadow-lg shadow-ck-red/30'
                  : disabled
                    ? 'text-ck-text-faint/30 cursor-not-allowed'
                    : isToday
                      ? 'text-ck-red font-bold hover:bg-ck-red/10 rounded-lg'
                      : 'text-ck-text-2 hover:bg-ck-surface-3 rounded-lg'
              }`}
            >
              {day.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-ck-red" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
          contact_email: email,
          contact_phone: phone,
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
  const canSubmit = !!name && !!phone && !!email;

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ck-red/10">
            <Calendar size={28} className="text-ck-red" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-ck-text md:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-ck-text-muted">{t('subtitle')}</p>
        </div>

        {/* Step indicator — desmobil style with line connectors */}
        <div className="mb-10">
          <div className="relative flex items-center justify-between">
            {/* Connector lines */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-12 sm:px-16">
              <div className="flex gap-0">
                <div className={`h-0.5 flex-1 transition-colors ${step > 1 ? 'bg-ck-red' : 'bg-ck-border'}`} />
                <div className={`h-0.5 flex-1 transition-colors ${step > 2 ? 'bg-ck-red' : 'bg-ck-border'}`} style={step === 2 ? { background: 'linear-gradient(to right, var(--ck-red, #dc2626) 0%, var(--ck-border, #333) 100%)' } : {}} />
              </div>
            </div>

            {[1, 2, 3].map(s => (
              <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    if (s === 1) setStep(1);
                    if (s === 2 && canGoStep2) setStep(2);
                    if (s === 3 && canGoStep2 && canGoStep3) setStep(3);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    step === s
                      ? 'bg-ck-red text-white shadow-lg shadow-ck-red/30 ring-4 ring-ck-red/20'
                      : step > s
                        ? 'bg-ck-red text-white'
                        : 'border-2 border-ck-border bg-ck-bg text-ck-text-faint'
                  }`}
                >
                  {step > s ? <Check size={18} /> : s}
                </button>
                <span className={`text-xs font-medium ${
                  step === s ? 'text-ck-red' : step > s ? 'text-ck-text-muted' : 'text-ck-text-faint'
                }`}>
                  {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content container */}
        <div className="rounded-xl border border-ck-border bg-ck-surface p-6 sm:p-8">
          {/* Step 1: Type & Location */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-ck-text">{t('chooseType')}</h2>
                <div className="mt-4 grid gap-3">
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
              </div>

              {/* Location */}
              <div>
                <h2 className="text-lg font-semibold text-ck-text">{t('location')}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  <div className="mt-4 grid gap-3">
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
              </div>

              <div className="flex items-center justify-between border-t border-ck-border pt-6">
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

          {/* Step 2: Date & Time — calendar grid */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ck-text-muted transition-colors hover:bg-ck-surface-3 hover:text-ck-text"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold text-ck-text">{t('chooseDateTime')}</h2>
              </div>

              {/* Calendar */}
              <CalendarGrid selectedDate={date} onSelect={setDate} />

              {/* Selected date label */}
              {date && (
                <div className="text-center text-sm font-medium text-ck-text">
                  {new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}

              {/* Time slots */}
              {date && (
                <div>
                  <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ck-text-muted">
                    <Clock size={14} />
                    {t('time')}
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-ck-text-faint">
                      <Loader2 size={16} className="animate-spin" />
                      {tCommon('loading')}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ck-text-faint">{t('noSlots')}</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {slots.map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            time === slot.time
                              ? 'border-ck-red/50 bg-ck-red text-white shadow-lg shadow-ck-red/30'
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

              <div className="flex justify-between border-t border-ck-border pt-6">
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ck-text-muted transition-colors hover:bg-ck-surface-3 hover:text-ck-text"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold text-ck-text">{t('yourDetails')}</h2>
              </div>

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
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                      <Phone size={14} className="mr-1.5 inline" />
                      {t('phone')} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="06-12345678"
                      className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ck-text-muted">
                      <Mail size={14} className="mr-1.5 inline" />
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="naam@voorbeeld.nl"
                      className="w-full rounded-lg border border-ck-border bg-ck-surface-2 px-4 py-3 text-ck-text placeholder:text-ck-text-faint focus:border-ck-red focus:outline-none"
                      required
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

              <div className="flex justify-between border-t border-ck-border pt-6">
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
        </div>

        {/* Location section — always visible below the form */}
        {location === 'shop' && (
          <div className="mt-10 rounded-xl border border-ck-border bg-ck-surface overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ck-red/10">
                  <MapPin size={20} className="text-ck-red" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ck-text-muted">{t('locationShop')}</h3>
                  <p className="mt-1 text-lg font-semibold text-ck-text">Satijnbloem 6</p>
                  <p className="text-sm text-ck-text-muted">3068 JP Rotterdam</p>
                  <p className="text-sm text-ck-text-muted">The Netherlands</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-ck-text-faint">
                    <span className="flex items-center gap-1"><Clock size={12} /> {t('openingHours')}</span>
                    <span className="flex items-center gap-1"><Car size={12} /> {t('freeParking')}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=Satijnbloem+6+3068+JP+Rotterdam"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover"
                    >
                      <Navigation size={14} />
                      {t('getDirections')}
                    </a>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Satijnbloem+6+3068+JP+Rotterdam"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-ck-border px-4 py-2 text-sm font-medium text-ck-text-muted transition-colors hover:text-ck-text hover:border-ck-border-2"
                    >
                      <MapPin size={14} />
                      {t('openInMaps')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* Map embed */}
            <div className="h-48 w-full bg-ck-surface-2 sm:h-56">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=4.5035,51.9095,4.5135,51.9155&layer=mapnik&marker=51.9125,4.5085"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Colour King locatie"
              />
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-ck-text-faint">
          <p>{t('openingHours')}</p>
        </div>
      </div>
    </div>
  );
}
