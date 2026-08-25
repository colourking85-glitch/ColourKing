-- 0015: job_tasks + time_entries tables

-- Job tasks
create table job_tasks (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references jobs(id),
  offer_line_id     uuid,
  title             text not null,
  description       text,
  status            task_status not null default 'todo',
  assigned_to       uuid references staff(id),
  estimated_minutes integer,
  actual_minutes    integer,
  sort_order        integer not null default 0,
  started_at        timestamptz,
  completed_at      timestamptz,
  blocked_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger job_tasks_updated_at
  before update on job_tasks
  for each row execute function update_updated_at();

alter table job_tasks enable row level security;

create policy "staff can read job_tasks"
  on job_tasks for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage job_tasks"
  on job_tasks for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index job_tasks_job_id_idx on job_tasks (job_id);
create index job_tasks_assigned_to_idx on job_tasks (assigned_to);
create index job_tasks_status_idx on job_tasks (status);

-- Time entries (clock in/out per task or general)
create table time_entries (
  id                uuid primary key default gen_random_uuid(),
  staff_id          uuid not null references staff(id),
  job_id            uuid references jobs(id),
  task_id           uuid references job_tasks(id),
  clock_in          timestamptz not null,
  clock_out         timestamptz,
  duration_minutes  integer,
  break_minutes     integer not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger time_entries_updated_at
  before update on time_entries
  for each row execute function update_updated_at();

alter table time_entries enable row level security;

create policy "staff can read time_entries"
  on time_entries for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage time_entries"
  on time_entries for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index time_entries_staff_id_idx on time_entries (staff_id);
create index time_entries_job_id_idx on time_entries (job_id);
create index time_entries_clock_in_idx on time_entries (clock_in desc);
