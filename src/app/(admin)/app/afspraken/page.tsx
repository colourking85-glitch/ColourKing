'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { AppointmentType, AppointmentStatus } from '@/types/database';

type AppointmentRow = {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  contact_name: string;
  contact_phone: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  resource_id: string | null;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null } | null;
  resources: { id: string; name: string } | null;
};

type ResourceRow = { id: string; type: string; name: string };
type BlackoutRow = { id: string; title: string; kind: string; start_date: string; end_date: string; resource_id: string | null; all_day: boolean };
type ViewMode = 'day' | '3day' | 'week' | 'month';

const TYPE_KEYS: Record<AppointmentType, string> = {
  inspection: 'inspection',
  drop_off: 'drop_off',
  collection: 'collection',
  repair_slot: 'repair_slot',
};

const TYPE_COLORS: Record<AppointmentType, string> = {
  inspection: 'bg-emerald-400/15 text-emerald-400 border-emerald-400',
  drop_off: 'bg-blue-400/15 text-blue-400 border-blue-400',
  collection: 'bg-purple-400/15 text-purple-400 border-purple-400',
  repair_slot: 'bg-amber-400/15 text-amber-400 border-amber-400',
};

const TYPE_DOT: Record<AppointmentType, string> = {
  inspection: 'bg-emerald-400',
  drop_off: 'bg-blue-400',
  collection: 'bg-purple-400',
  repair_slot: 'bg-amber-400',
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  requested: 'border-dashed',
  confirmed: 'border-solid',
  cancelled: 'line-through opacity-50',
  completed: 'border-solid opacity-70',
};

const SHORT_DAYS = ['dayMo', 'dayTu', 'dayWe', 'dayTh', 'dayFr', 'daySa', 'daySu'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtDisplay(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function AppointmentCalendarPage() {
  const t = useTranslations('ap');
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const { days, dateFrom, dateTo, rangeLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (view === 'day') {
      const d = new Date(anchor);
      d.setHours(0, 0, 0, 0);
      return {
        days: [d],
        dateFrom: fmt(d),
        dateTo: fmt(d),
        rangeLabel: d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      };
    }

    if (view === '3day') {
      const start = new Date(anchor);
      start.setHours(0, 0, 0, 0);
      const ds = Array.from({ length: 3 }, (_, i) => addDays(start, i));
      return {
        days: ds,
        dateFrom: fmt(ds[0]),
        dateTo: fmt(ds[2]),
        rangeLabel: `${fmtDisplay(ds[0])} — ${fmtDisplay(ds[2])} ${ds[2].getFullYear()}`,
      };
    }

    if (view === 'month') {
      const first = getFirstOfMonth(anchor);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
      const startDay = getMonday(first);
      const endDay = addDays(startDay, 41); // 6 weeks
      const ds: Date[] = [];
      for (let d = new Date(startDay); d <= endDay; d = addDays(d, 1)) {
        ds.push(new Date(d));
      }
      return {
        days: ds,
        dateFrom: fmt(startDay),
        dateTo: fmt(endDay),
        rangeLabel: first.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }),
      };
    }

    // week
    const monday = getMonday(anchor);
    const ds = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    return {
      days: ds,
      dateFrom: fmt(ds[0]),
      dateTo: fmt(ds[6]),
      rangeLabel: `${ds[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} — ${ds[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    };
  }, [view, anchor]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (typeFilter) params.set('type', typeFilter);

    Promise.all([
      fetch(`/api/appointments?${params}`).then(r => r.ok ? r.json() : []),
      fetch('/api/resources').then(r => r.ok ? r.json() : []),
      fetch(`/api/blackouts?from=${dateFrom}&to=${dateTo}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([appts, res, bo]) => {
        setAppointments(appts);
        setResources(res);
        setBlackouts(bo);
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, typeFilter]);

  const closureFor = (dateStr: string) =>
    blackouts.find(b => !b.resource_id && b.all_day && b.start_date <= dateStr && b.end_date >= dateStr);

  const filtered = useMemo(() => {
    if (!resourceFilter) return appointments;
    return appointments.filter(a => a.resource_id === resourceFilter);
  }, [appointments, resourceFilter]);

  function navigate(dir: -1 | 1) {
    const d = new Date(anchor);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === '3day') d.setDate(d.getDate() + dir * 3);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  }

  function goToday() {
    setAnchor(new Date());
  }

  const todayStr = fmt(new Date());

  function getApptsForDay(date: Date) {
    return filtered.filter(a => a.scheduled_date === fmt(date));
  }

  function getTopOffset(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return ((h - 7) * 60 + m);
  }

  const viewButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'day', label: t('viewDay') },
    { mode: '3day', label: t('view3Day') },
    { mode: 'week', label: t('viewWeek') },
    { mode: 'month', label: t('viewMonth') },
  ];

  // ---------- Month Grid ----------
  if (view === 'month') {
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    const monthNum = getFirstOfMonth(anchor).getMonth();

    return (
      <div className="space-y-4">
        <Header
          t={t}
          viewButtons={viewButtons}
          view={view}
          setView={setView}
          rangeLabel={rangeLabel}
          navigate={navigate}
          goToday={goToday}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          resourceFilter={resourceFilter}
          setResourceFilter={setResourceFilter}
          resources={resources}
        />

        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-hidden">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
            </div>
          ) : (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-ck-border">
                {SHORT_DAYS.map(dk => (
                  <div key={dk} className="py-2 text-center text-[11px] font-medium text-ck-text-muted">
                    {t(dk)}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-ck-divider last:border-b-0">
                  {week.map((day, di) => {
                    const dateStr = fmt(day);
                    const isToday = dateStr === todayStr;
                    const isCurrentMonth = day.getMonth() === monthNum;
                    const dayAppts = getApptsForDay(day);
                    const closure = closureFor(dateStr);

                    return (
                      <div
                        key={di}
                        title={closure ? `${t('closedDay')}: ${closure.title}` : undefined}
                        className={`min-h-[90px] border-r border-ck-divider last:border-r-0 p-1.5 ${
                          !isCurrentMonth ? 'opacity-40' : ''
                        } ${closure ? 'bg-red-500/[0.06] bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(239,68,68,0.08)_6px,rgba(239,68,68,0.08)_12px)]' : ''}`}
                      >
                        {closure && (
                          <div className="mb-0.5 truncate rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-400">
                            {t('closedDay')} · {closure.title}
                          </div>
                        )}
                        <div className={`mb-1 text-right text-[11px] font-medium ${
                          isToday ? 'text-ck-red' : 'text-ck-text-muted'
                        }`}>
                          {isToday ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ck-red text-[10px] text-white">
                              {day.getDate()}
                            </span>
                          ) : (
                            day.getDate()
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {dayAppts.slice(0, 3).map(appt => (
                            <Link
                              key={appt.id}
                              href={`/app/afspraken/${appt.id}`}
                              className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate hover:opacity-80 ${TYPE_COLORS[appt.type]} ${STATUS_STYLES[appt.status]}`}
                            >
                              <span className="font-medium">{appt.scheduled_time.slice(0, 5)}</span>
                              <span className="truncate">{appt.contact_name}</span>
                            </Link>
                          ))}
                          {dayAppts.length > 3 && (
                            <button
                              onClick={() => { setView('day'); setAnchor(day); }}
                              className="w-full text-center text-[9px] text-ck-text-muted hover:text-ck-red"
                            >
                              +{dayAppts.length - 3} {t('more')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <Legend t={t} />
      </div>
    );
  }

  // ---------- Day / 3-Day / Week Grid ----------
  return (
    <div className="space-y-4">
      <Header
        t={t}
        viewButtons={viewButtons}
        view={view}
        setView={setView}
        rangeLabel={rangeLabel}
        navigate={navigate}
        goToday={goToday}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        resourceFilter={resourceFilter}
        setResourceFilter={setResourceFilter}
        resources={resources}
      />

      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-hidden">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : (
          <div className="flex">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-ck-border">
              <div className="h-10 border-b border-ck-border" />
              {HOURS.map(h => (
                <div key={h} className="relative h-[60px] border-b border-ck-divider">
                  <span className="absolute -top-2 right-2 text-[10px] text-ck-text-muted">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, i) => {
              const dateStr = fmt(day);
              const isToday = dateStr === todayStr;
              const dayAppts = getApptsForDay(day);
              const dayIdx = (day.getDay() + 6) % 7; // 0=Mon
              const closure = closureFor(dateStr);

              return (
                <div key={i} className="flex-1 min-w-0 border-r border-ck-divider last:border-r-0">
                  {/* Day header */}
                  <div
                    className={`flex h-10 items-center justify-center gap-1 border-b border-ck-border text-xs ${
                      closure ? 'bg-red-500/10 text-red-400 font-medium' : isToday ? 'bg-ck-red/10 text-ck-red font-medium' : 'text-ck-text-muted'
                    }`}
                    title={closure ? `${t('closedDay')}: ${closure.title}` : undefined}
                  >
                    <span>{t(SHORT_DAYS[dayIdx])}</span>
                    <span className={isToday ? 'rounded-full bg-ck-red px-1.5 py-0.5 text-white text-[10px]' : ''}>
                      {fmtDisplay(day)}
                    </span>
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {HOURS.map(h => (
                      <div key={h} className="h-[60px] border-b border-ck-divider" />
                    ))}
                    {closure && (
                      <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center bg-red-500/[0.06] bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(239,68,68,0.07)_8px,rgba(239,68,68,0.07)_16px)] pt-3">
                        <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">{t('closedDay')} · {closure.title}</span>
                      </div>
                    )}

                    {/* Appointment blocks */}
                    {dayAppts.map(appt => {
                      const top = getTopOffset(appt.scheduled_time);
                      const height = Math.max(appt.duration_minutes, 20);
                      const colorClass = TYPE_COLORS[appt.type];
                      const statusClass = STATUS_STYLES[appt.status];

                      return (
                        <Link
                          key={appt.id}
                          href={`/app/afspraken/${appt.id}`}
                          className={`absolute left-0.5 right-0.5 rounded-[6px] border-[0.5px] px-1.5 py-0.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${colorClass} ${statusClass}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className="text-[10px] font-medium truncate">
                            {appt.scheduled_time.slice(0, 5)} {appt.contact_name}
                          </div>
                          {height > 30 && (
                            <div className="text-[9px] opacity-70 truncate">
                              {t(TYPE_KEYS[appt.type])}
                              {appt.resources ? ` · ${appt.resources.name}` : ''}
                            </div>
                          )}
                          {height > 45 && appt.vehicles && (
                            <div className="text-[9px] opacity-60 truncate">
                              {appt.vehicles.kenteken ?? appt.vehicles.make}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Legend t={t} />
    </div>
  );
}

// ---------- Shared Sub-Components ----------

function Header({
  t, viewButtons, view, setView, rangeLabel, navigate, goToday,
  typeFilter, setTypeFilter, resourceFilter, setResourceFilter, resources,
}: {
  t: ReturnType<typeof useTranslations>;
  viewButtons: { mode: ViewMode; label: string }[];
  view: ViewMode;
  setView: (v: ViewMode) => void;
  rangeLabel: string;
  navigate: (dir: -1 | 1) => void;
  goToday: () => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  resourceFilter: string;
  setResourceFilter: (v: string) => void;
  resources: ResourceRow[];
}) {
  return (
    <>
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="AP05" />
          <h1 className="text-base font-medium text-ck-text">{t('agenda')}</h1>
        </div>
        <Link
          href="/app/afspraken/nieuw"
          className="flex items-center gap-2 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      {/* Navigation + view toggle + filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToday}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            {t('today')}
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-sm font-medium text-ck-text">{rangeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-hidden">
            {viewButtons.map(b => (
              <button
                key={b.mode}
                onClick={() => setView(b.mode)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === b.mode
                    ? 'bg-ck-red text-white'
                    : 'text-ck-text-muted hover:text-ck-text hover:bg-ck-surface-2'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <Filter size={14} className="text-ck-text-muted ml-2" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">{t('allTypes')}</option>
            {(Object.keys(TYPE_KEYS) as AppointmentType[]).map(k => (
              <option key={k} value={k}>{t(TYPE_KEYS[k])}</option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">{t('allResources')}</option>
            {resources.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

function Legend({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex items-center gap-4 text-[10px] text-ck-text-muted">
      {(Object.keys(TYPE_KEYS) as AppointmentType[]).map(k => (
        <div key={k} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-sm ${TYPE_DOT[k]}`} />
          <span>{t(TYPE_KEYS[k])}</span>
        </div>
      ))}
      <span className="ml-4">|</span>
      <span className="ml-2">---  = {t('legendRequested')}</span>
      <span>___  = {t('legendConfirmed')}</span>
      <span className="line-through">abc = {t('legendCancelled')}</span>
    </div>
  );
}
