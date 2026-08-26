'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search, CheckSquare, Plus, Play, Square, Clock,
  AlertTriangle, ChevronDown, ChevronRight, User,
  CalendarDays, Wrench, ClipboardList,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { TaskStatus } from '@/types/database';

type TaskRow = {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  jobs: { id: string; job_number: string | null } | null;
  staff: { id: string; name: string } | null;
};

type ActiveEntry = {
  id: string;
  task_id: string | null;
  clock_in: string;
} | null;

const STATUS_COLORS: Record<TaskStatus, string> = {
  in_progress: 'text-blue-400 bg-blue-400/10',
  todo: 'text-amber-400 bg-amber-400/10',
  blocked: 'text-red-400 bg-red-400/10',
  done: 'text-emerald-400 bg-emerald-400/10',
};

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'todo', 'blocked', 'done'];

function formatMinutes(mins: number | null): string {
  if (mins == null) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}

function elapsedSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}

export default function TasksPage() {
  const t = useTranslations('tk');
  const tc = useTranslations('common');
  const statusLabel = (s: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      in_progress: t('inProgress'),
      todo: t('todo'),
      blocked: t('blocked'),
      done: t('done'),
    };
    return map[s];
  };
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['done']));
  const [activeEntry, setActiveEntry] = useState<ActiveEntry>(null);
  const [timerTick, setTimerTick] = useState(0);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (staffFilter) params.set('assigned_to', staffFilter);
    fetch(`/api/tasks?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [search, staffFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Fetch active time entry (mock staff for now)
  useEffect(() => {
    fetch('/api/time-entries/active?staff_id=mock-admin')
      .then(r => r.ok ? r.json() : null)
      .then(setActiveEntry);
  }, []);

  // Timer tick for active clock display
  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(() => setTimerTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, TaskRow[]>);

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, blockedReason?: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_status', status: newStatus, blocked_reason: blockedReason }),
      });
      fetchTasks();
    } catch {
      // ignore
    }
  };

  const handleClockIn = async (taskId: string, jobId: string) => {
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: 'mock-admin', job_id: jobId, task_id: taskId }),
      });
      if (res.ok) {
        const entry = await res.json();
        setActiveEntry(entry);
      }
    } catch {
      // ignore
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;
    try {
      await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setActiveEntry(null);
      fetchTasks();
    } catch {
      // ignore
    }
  };

  const tw = useTranslations('myWork');

  const [stats, setStats] = useState({ tasks: 0, appointments: 0, overdue: 0, jobs: 0 });
  useEffect(() => {
    const todoCount = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
    const overdueCount = tasks.filter(t => t.status === 'in_progress' && t.started_at && (Date.now() - new Date(t.started_at).getTime() > 24 * 3600000)).length;
    setStats(prev => ({ ...prev, tasks: todoCount, overdue: overdueCount }));
  }, [tasks]);

  useEffect(() => {
    fetch('/api/appointments?upcoming=true&limit=5')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown[]) => setStats(prev => ({ ...prev, appointments: data.length })))
      .catch(() => {});
    fetch('/api/jobs?stage=in_progress&limit=50')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown[]) => setStats(prev => ({ ...prev, jobs: data.length })))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* My Work overview cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <div className="flex items-center gap-2 text-white/40">
            <ClipboardList size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">{tw('assignedTasks')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.tasks}</p>
        </div>
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <div className="flex items-center gap-2 text-white/40">
            <CalendarDays size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">{tw('upcomingAppointments')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.appointments}</p>
        </div>
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <div className="flex items-center gap-2 text-red-400/60">
            <AlertTriangle size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">{tw('overdueItems')}</span>
          </div>
          <p className={`mt-2 text-2xl font-semibold ${stats.overdue > 0 ? 'text-red-400' : 'text-white'}`}>{stats.overdue}</p>
        </div>
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-surface p-4">
          <div className="flex items-center gap-2 text-white/40">
            <Wrench size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">{tw('jobsInQueue')}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.jobs}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="TS05" />
          <div>
            <h1 className="text-base font-medium text-ck-text">{t('title')}</h1>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">
              {t('allTasks')}
            </p>
          </div>
        </div>
        <Link
          href="/app/taken/nieuw"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors"
        >
          <Plus size={14} />
          {t('createTask')}
        </Link>
      </div>

      {/* Active timer banner */}
      {activeEntry && (
        <div className="flex items-center justify-between rounded-[10px] border-[0.5px] border-blue-400/30 bg-blue-400/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            <Clock size={16} className="text-blue-400" />
            <span className="text-sm text-ck-text">
              {t('clockedIn', { elapsed: elapsedSince(activeEntry.clock_in) })}
            </span>
          </div>
          <button
            onClick={handleClockOut}
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-1.5 text-sm text-ck-text hover:bg-ck-surface-2 transition-colors"
          >
            <Square size={12} />
            {t('clockOut')}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface py-2 pl-10 pr-4 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <input
          type="text"
          placeholder={t('filterStaff')}
          value={staffFilter}
          onChange={e => setStaffFilter(e.target.value)}
          className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
        />
      </div>

      {/* Task groups */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
          <CheckSquare size={32} className="text-ck-text-faint" />
          <p className="text-sm text-ck-text-muted">
            {search || staffFilter ? t('noTasksFound') : t('noTasks')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {STATUS_ORDER.map(status => {
            const group = grouped[status];
            if (group.length === 0) return null;
            const isCollapsed = collapsedGroups.has(status);
            const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;

            return (
              <div key={status} className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
                <button
                  onClick={() => toggleGroup(status)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                >
                  <CollapseIcon size={14} className="text-ck-text-muted" />
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[status]}`}>
                    {statusLabel(status)}
                  </span>
                  <span className="text-[11px] text-ck-text-muted">
                    {group.length === 1 ? t('taskCount', { count: group.length }) : t('taskCountPlural', { count: group.length })}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-ck-divider">
                    {group.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 border-b border-ck-divider px-4 py-3 last:border-0 hover:bg-ck-surface-2/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ck-text truncate">
                              {task.title}
                            </span>
                            {task.blocked_reason && (
                              <span className="flex items-center gap-1 text-[10px] text-red-400">
                                <AlertTriangle size={10} />
                                {task.blocked_reason}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-ck-text-muted">
                            {task.jobs && (
                              <Link
                                href={`/app/opdrachten/${task.job_id}`}
                                className="hover:text-ck-red transition-colors"
                              >
                                {task.jobs.job_number ?? task.job_id.slice(0, 8)}
                              </Link>
                            )}
                            {task.staff && (
                              <span className="flex items-center gap-1">
                                <User size={10} />
                                {task.staff.name}
                              </span>
                            )}
                            <span>
                              {formatMinutes(task.actual_minutes)} / {formatMinutes(task.estimated_minutes)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {status === 'todo' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border px-2.5 py-1 text-[11px] text-ck-text hover:bg-ck-surface-2 transition-colors"
                            >
                              <Play size={10} />
                              {t('start')}
                            </button>
                          )}
                          {status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(task.id, 'done')}
                                className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1 text-[11px] text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                              >
                                <CheckSquare size={10} />
                                {t('complete')}
                              </button>
                              {!activeEntry?.task_id || activeEntry.task_id !== task.id ? (
                                <button
                                  onClick={() => handleClockIn(task.id, task.job_id)}
                                  className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-blue-400/30 bg-blue-400/5 px-2.5 py-1 text-[11px] text-blue-400 hover:bg-blue-400/10 transition-colors"
                                >
                                  <Clock size={10} />
                                  {t('clockIn')}
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-blue-400">
                                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                                  {elapsedSince(activeEntry.clock_in)}
                                </span>
                              )}
                            </>
                          )}
                          {status === 'blocked' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'todo')}
                              className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-ck-border px-2.5 py-1 text-[11px] text-ck-text hover:bg-ck-surface-2 transition-colors"
                            >
                              {t('unblock')}
                            </button>
                          )}
                          {(status === 'todo' || status === 'in_progress') && (
                            <button
                              onClick={() => {
                                const reason = prompt(t('blockReasonPrompt'));
                                if (reason) handleStatusChange(task.id, 'blocked', reason);
                              }}
                              className="inline-flex items-center gap-1 rounded-[10px] border-[0.5px] border-red-400/30 px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-400/5 transition-colors"
                            >
                              <AlertTriangle size={10} />
                              {t('block')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
