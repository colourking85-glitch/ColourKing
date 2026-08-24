-- 0007: leads + lead_photos tables

create table leads (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references customers(id),
  vehicle_id          uuid references vehicles(id),
  source              text not null default 'website',
  channel             text,
  name                text not null,
  email               text,
  phone               text,
  kenteken            text,
  damage_description  text,
  preferred_date      date,
  locale              text not null default 'nl' check (locale in ('nl', 'en', 'tr')),
  status              lead_status not null default 'new',
  lost_reason         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

alter table leads enable row level security;

create policy "staff can read leads"
  on leads for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage leads"
  on leads for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index leads_status_idx on leads (status);
create index leads_created_at_idx on leads (created_at desc);
create index leads_customer_id_idx on leads (customer_id);

-- Lead photos
create table lead_photos (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

alter table lead_photos enable row level security;

create policy "staff can read lead_photos"
  on lead_photos for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage lead_photos"
  on lead_photos for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index lead_photos_lead_id_idx on lead_photos (lead_id);
