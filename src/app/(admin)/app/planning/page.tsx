'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Zap, Users,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type TimeEntryRow = {
  id: string;
  staff_id: string;
  job_id: string | null;
  task_id: string | null;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  staff: { id: string; name: string } | null;
  jobs: { id: string; job_number: string | null } | null;
  job_tasks: { id: string; title: string } | null;
};

type StaffSummary = {
  id: string;
  name: string;
  days: Record<string, number>; // date -> minutes
  total: number;
};

function getWeekDates(offset: number): { from: Date; to: Date; dates: Date[] } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }

  const to = new Date(dates[6]);
  to.setHours(23, 59, 59, 999);

  return { from: monday, to, dates };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

function formatHours(mins: number): string {
  if (mins === 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${h}u`;
}

function utilizationColor(mins: number, targetMinutes: number): string {
  if (mins === 0) return '';
  const pct = mins / targetMinutes;
  if (pct >= 0.8) return 'bg-emerald-400/15 text-emerald-400';
  if (pct >= 0.5) return 'bg-amber-400/15 text-amber-400';
  return 'bg-red-400/15 text-red-400';
}

export default function PlanningPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ staffId: string; date: string } | null>(null);

  const { from, to, dates } = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Target: 8 hours per day
  const TARGET_MINUTES = 8 * 60;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('from', from.toISOString());
    params.set('to', to.toISOString());
    fetch(`/api/time-entries?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [from, to]);

  // Build staff summaries
  const staffSummaries = useMemo(() => {
    const byStaff: Record<string, StaffSummary> = {};

    for (const entry of entries) {
      const sid = entry.staff_id;
      if (!byStaff[sid]) {
        byStaff[sid] = {
          id: sid,
          name: entry.staff?.name ?? sid.slice(0, 8),
          days: {},
          total: 0,
        };
      }

      if (entry.duration_minutes && entry.clock_in) {
        const day = toISODate(new Date(entry.clock_in));
        byStaff[sid].days[day] = (byStaff[sid].days[day] ?? 0) + entry.duration_minutes;
        byStaff[sid].total += entry.duration_minutes;
      }
    }

    return Object.values(byStaff).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  // Day totals
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const d of dates) {
      const key = toISODate(d);
      totals[key] = staffSummaries.reduce((sum, s) => sum + (s.days[key] ?? 0), 0);
    }
    return totals;
  }, [dates, staffSummaries]);

  // Cell detail entries
  const cellEntries = useMemo(() => {
    if (!selectedCell) return [];
    return entries.filter(e => {
      if (e.staff_id !== selectedCell.staffId) return false;
      if (!e.clock_in) return false;
      return toISODate(new Date(e.clock_in)) === selectedCell.date;
    });
  }, [selectedCell, entries]);

  const weekLabel = `${dates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${dates[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="TS10" />
          <div>
            <h1 className="text-base font-medium text-ck-text">Planning & Urenregistratie</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              Weekoverzicht uren per medewerker
            </p>
          </div>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronLeft size={16} className="text-ck-text-muted" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text hover:bg-ck-surface-2 transition-colors"
          >
            <Calendar size={14} className="inline mr-1.5" />
            Vandaag
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-2 hover:bg-ck-surface-2 transition-colors"
          >
            <ChevronRight size={16} className="text-ck-text-muted" />
          </button>
        </div>
        <span className="text-sm font-medium text-ck-text">{weekLabel}</span>
      </div>

      {/* Grid */}
      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface overflow-x-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
          </div>
        ) : staffSummaries.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <Users size={32} className="text-ck-text-faint" />
            <p className="text-sm text-ck-text-muted">Geen uren geregistreerd deze week</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-ck-border text-[11px] uppercase tracking-wider text-ck-text-muted">
                <th className="px-4 py-3 text-left font-medium">Medewerker</th>
                {dates.map((d, i) => {
                  const isToday = toISODate(d) === toISODate(new Date());
                  return (
                    <th
                      key={i}
                      className={`px-3 py-3 text-center font-medium ${isToday ? 'text-ck-red' : ''}`}
                    >
                      <div>{DAY_NAMES[i]}</div>
                      <div className="text-[10px] font-normal">
                        {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-center font-medium">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {staffSummaries.map(staff => (
                <tr key={staff.id} className="border-b border-ck-divider last:border-0">
                  <td className="px-4 py-3 text-sm text-ck-text">{staff.name}</td>
                  {dates.map((d, i) => {
                    const key = toISODate(d);
                    const mins = staff.days[key] ?? 0;
                    const isWeekend = i >= 5;
                    const colorClass = isWeekend ? '' : utilizationColor(mins, TARGET_MINUTES);
                    const isSelected = selectedCell?.staffId === staff.id && selectedCell?.date === key;

                    return (
                      <td key={i} className="px-1 py-2 text-center">
                        <button
                          onClick={() => setSelectedCell(
                            isSelected ? null : { staffId: staff.id, date: key }
                          )}
                          className={`inline-flex min-w-[48px] items-center justify-center rounded-[10px] px-2 py-1.5 font-mono text-xs tabular-nums transition-colors ${
                            isSelected
                              ? 'ring-1 ring-ck-red'
                              : ''
                          } ${colorClass || 'text-ck-text-muted'}`}
                        >
                          {formatHours(mins)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm tabular-nums text-ck-text">
                      {formatHours(staff.total)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Summary row */}
              <tr className="border-t border-ck-border bg-ck-surface-2/30">
                <td className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ck-text-muted">
                  Totaal
                </td>
                {dates.map((d, i) => {
                  const key = toISODate(d);
                  const mins = dayTotals[key] ?? 0;
                  return (
                    <td key={i} className="px-3 py-3 text-center font-mono text-xs tabular-nums text-ck-text-muted">
                      {formatHours(mins)}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-mono text-sm tabular-nums text-ck-text">
                  {formatHours(Object.values(dayTotals).reduce((a, b) => a + b, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Cell detail */}
      {selectedCell && cellEntries.length > 0 && (
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-ck-text-muted" />
            <span className="text-sm font-medium text-ck-text">
              Detail: {new Date(selectedCell.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="space-y-2">
            {cellEntries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-[10px] border-[0.5px] border-ck-divider bg-ck-bg px-3 py-2"
              >
                <div className="text-sm text-ck-text-2">
                  {entry.job_tasks?.title ?? entry.jobs?.job_number ?? 'Algemeen'}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ck-text-muted">
                  <span>
                    {new Date(entry.clock_in).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {entry.clock_out
                      ? new Date(entry.clock_out).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
                      : 'actief'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {entry.duration_minutes ? formatHours(entry.duration_minutes) : '-'}
                  </span>
                  {entry.break_minutes > 0 && (
                    <span className="text-ck-text-faint">
                      ({entry.break_minutes}m pauze)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-ck-text-muted">
        <Zap size={12} />
        <span>Bezetting:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-400/15" />
          &ge;80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-400/15" />
          50-80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-400/15" />
          &lt;50%
        </span>
      </div>
    </div>
  );
}
