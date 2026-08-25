-- 0013: appointments, resources, opening_hours, blackouts

-- Resources (bays, booths, staff slots)
create table resources (
  id          uuid primary key default gen_random_uuid(),
  type        resource_type not null,
  name        text not null,
  capacity    integer not null default 1,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger resources_updated_at
  before update on resources
  for each row execute function update_updated_at();

alter table resources enable row level security;

create policy "staff can read resources"
  on resources for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage resources"
  on resources for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

-- Opening hours
create table opening_hours (
  id          uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Monday
  open_time   time not null,
  close_time  time not null,
  created_at  timestamptz not null default now()
);

alter table opening_hours enable row level security;

create policy "staff can read opening_hours"
  on opening_hours for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage opening_hours"
  on opening_hours for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

-- Blackout periods (holidays, closures)
create table blackouts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  start_date  date not null,
  end_date    date not null,
  all_day     boolean not null default true,
  resource_id uuid references resources(id),
  created_at  timestamptz not null default now()
);

alter table blackouts enable row level security;

create policy "staff can read blackouts"
  on blackouts for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage blackouts"
  on blackouts for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index blackouts_dates_idx on blackouts (start_date, end_date);
create index blackouts_resource_id_idx on blackouts (resource_id);

-- Appointments
create table appointments (
  id               uuid primary key default gen_random_uuid(),
  type             appointment_type not null,
  status           appointment_status not null default 'requested',
  customer_id      uuid references customers(id),
  vehicle_id       uuid references vehicles(id),
  job_id           uuid references jobs(id),
  resource_id      uuid references resources(id),
  contact_name     text not null,
  contact_phone    text,
  contact_email    text,
  scheduled_date   date not null,
  scheduled_time   time not null,
  duration_minutes integer not null default 30,
  notes            text,
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text,
  completed_at     timestamptz,
  created_by       uuid references staff(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at();

alter table appointments enable row level security;

create policy "staff can read appointments"
  on appointments for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage appointments"
  on appointments for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index appointments_date_idx on appointments (scheduled_date);
create index appointments_status_idx on appointments (status);
create index appointments_customer_id_idx on appointments (customer_id);
create index appointments_vehicle_id_idx on appointments (vehicle_id);
create index appointments_job_id_idx on appointments (job_id);
create index appointments_resource_id_idx on appointments (resource_id);
create index appointments_created_at_idx on appointments (created_at desc);

-- Seed default opening hours (Mon-Fri 08:00-17:00)
insert into opening_hours (day_of_week, open_time, close_time) values
  (0, '08:00', '17:00'),
  (1, '08:00', '17:00'),
  (2, '08:00', '17:00'),
  (3, '08:00', '17:00'),
  (4, '08:00', '17:00');

-- Seed default resources
insert into resources (type, name, capacity) values
  ('bay', 'Bay 1', 1),
  ('bay', 'Bay 2', 1);
