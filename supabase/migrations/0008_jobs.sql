-- 0008: jobs, job_events, job_photos tables

create table jobs (
  id            uuid primary key default gen_random_uuid(),
  number        serial unique,
  customer_id   uuid not null references customers(id),
  vehicle_id    uuid not null references vehicles(id),
  lead_id       uuid references leads(id),
  offer_id      uuid,
  stage         job_stage not null default 'intake',
  assigned_to   uuid references staff(id),
  intake_km     int,
  outtake_km    int,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  closed_at     timestamptz
);

create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

alter table jobs enable row level security;

create policy "staff can read jobs"
  on jobs for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage jobs"
  on jobs for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index jobs_customer_id_idx on jobs (customer_id);
create index jobs_vehicle_id_idx on jobs (vehicle_id);
create index jobs_stage_idx on jobs (stage);
create index jobs_assigned_to_idx on jobs (assigned_to);

-- job_events: audit trail for every state change and notable action
create table job_events (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references jobs(id) on delete cascade,
  event_type    job_event_type not null,
  from_stage    job_stage,
  to_stage      job_stage,
  actor_id      uuid references staff(id),
  payload       jsonb,
  note          text,
  created_at    timestamptz not null default now()
);

alter table job_events enable row level security;

create policy "staff can read job_events"
  on job_events for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can insert job_events"
  on job_events for insert
  with check (auth.uid() in (select s.id from staff s where s.active));

create index job_events_job_id_idx on job_events (job_id);
create index job_events_created_idx on job_events (created_at);

-- job_photos: photos taken at each phase
create table job_photos (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references jobs(id) on delete cascade,
  phase         photo_phase not null,
  storage_path  text not null,
  caption       text,
  uploaded_by   uuid references staff(id),
  created_at    timestamptz not null default now()
);

alter table job_photos enable row level security;

create policy "staff can read job_photos"
  on job_photos for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can insert job_photos"
  on job_photos for insert
  with check (auth.uid() in (select s.id from staff s where s.active));

create index job_photos_job_id_idx on job_photos (job_id);
create index job_photos_phase_idx on job_photos (phase);
