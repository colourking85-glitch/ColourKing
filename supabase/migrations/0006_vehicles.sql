-- 0006: vehicles table

create table vehicles (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  kenteken      text,
  vin           text,
  make          text,
  model         text,
  year          int,
  colour        text,
  paint_code    text,
  fuel          text,
  body_type     text,
  rdw_snapshot  jsonb,
  wok           boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create trigger vehicles_updated_at
  before update on vehicles
  for each row execute function update_updated_at();

alter table vehicles enable row level security;

create policy "staff can read vehicles"
  on vehicles for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage vehicles"
  on vehicles for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index vehicles_customer_id_idx on vehicles (customer_id);
create index vehicles_kenteken_idx on vehicles (kenteken);
