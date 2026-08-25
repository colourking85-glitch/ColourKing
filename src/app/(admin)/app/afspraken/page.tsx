'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Calendar, Filter } from 'lucide-react';
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

type ResourceRow = {
  id: string;
  type: string;
  name: string;
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  inspection: 'Inspectie',
  drop_off: 'Afleveren',
  collection: 'Ophalen',
  repair_slot: 'Reparatie',
};

const TYPE_COLORS: Record<AppointmentType, string> = {
  inspection: 'bg-emerald-400/15 text-emerald-400 border-emerald-400',
  drop_off: 'bg-blue-400/15 text-blue-400 border-blue-400',
  collection: 'bg-purple-400/15 text-purple-400 border-purple-400',
  repair_slot: 'bg-amber-400/15 text-amber-400 border-amber-400',
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  requested: 'border-dashed',
  confirmed: 'border-solid',
  cancelled: 'line-through opacity-50',
  completed: 'border-solid opacity-70',
};

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 - 18:00

export default function AppointmentCalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const dateFrom = formatDate(weekDays[0]);
  const dateTo = formatDate(weekDays[6]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (typeFilter) params.set('type', typeFilter);

    Promise.all([
      fetch(`/api/appointments?${params}`).then(r => r.ok ? r.json() : []),
      fetch('/api/resources').then(r => r.ok ? r.json() : []),
    ])
      .then(([appts, res]) => {
        setAppointments(appts);
        setResources(res);
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, typeFilter]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (resourceFilter) {
      filtered = filtered.filter(a => a.resource_id === resourceFilter);
    }
    return filtered;
  }, [appointments, resourceFilter]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function goToday() {
    setWeekStart(getMonday(new Date()));
  }

  const today = formatDate(new Date());

  function getAppointmentsForDay(date: Date) {
    const dateStr = formatDate(date);
    return filteredAppointments.filter(a => a.scheduled_date === dateStr);
  }

  function getTopOffset(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return ((h - 7) * 60 + m) * (60 / 60); // 60px per hour
  }

  function getHeight(minutes: number): number {
    return minutes * (60 / 60); // 60px per hour
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="AP05" />
          <div>
            <h1 className="text-base font-medium text-ck-text">Agenda</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              Weekoverzicht afspraken
            </p>
          </div>
        </div>
        <Link
          href="/app/afspraken/nieuw"
          className="flex items-center gap-2 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={16} />
          Nieuwe afspraak
        </Link>
      </div>

      {/* Navigation & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToday}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            Vandaag
          </button>
          <button
            onClick={nextWeek}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 text-ck-text-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-sm font-medium text-ck-text">
            {weekDays[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' — '}
            {weekDays[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-ck-text-muted" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">Alle types</option>
            {(Object.keys(TYPE_LABELS) as AppointmentType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text focus:border-ck-red focus:outline-none"
          >
            <option value="">Alle resources</option>
            {resources.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
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
            {weekDays.map((day, i) => {
              const dateStr = formatDate(day);
              const isToday = dateStr === today;
              const dayAppts = getAppointmentsForDay(day);

              return (
                <div key={i} className="flex-1 min-w-0 border-r border-ck-divider last:border-r-0">
                  {/* Day header */}
                  <div
                    className={`flex h-10 items-center justify-center gap-1 border-b border-ck-border text-xs ${
                      isToday ? 'bg-ck-red/10 text-ck-red font-medium' : 'text-ck-text-muted'
                    }`}
                  >
                    <span>{DAY_NAMES[i]}</span>
                    <span className={isToday ? 'rounded-full bg-ck-red px-1.5 py-0.5 text-white text-[10px]' : ''}>
                      {formatDateDisplay(day)}
                    </span>
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {HOURS.map(h => (
                      <div key={h} className="h-[60px] border-b border-ck-divider" />
                    ))}

                    {/* Appointment blocks */}
                    {dayAppts.map(appt => {
                      const top = getTopOffset(appt.scheduled_time);
                      const height = Math.max(getHeight(appt.duration_minutes), 20);
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
                              {TYPE_LABELS[appt.type]}
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-ck-text-muted">
        {(Object.keys(TYPE_LABELS) as AppointmentType[]).map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${TYPE_COLORS[t].split(' ')[0]}`} />
            <span>{TYPE_LABELS[t]}</span>
          </div>
        ))}
        <span className="ml-4">|</span>
        <span className="ml-2">---  = aangevraagd</span>
        <span>___  = bevestigd</span>
        <span className="line-through">abc = geannuleerd</span>
      </div>
    </div>
  );
}
