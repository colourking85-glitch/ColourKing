-- 0005: customers table

create table customers (
  id          uuid primary key default gen_random_uuid(),
  type        customer_type not null default 'private',
  name        text not null,
  email       text,
  phone       text,
  address     text,
  postcode    text,
  city        text,
  country     text default 'NL',
  kvk_number  text,
  btw_number  text,
  locale      text not null default 'nl' check (locale in ('nl', 'en', 'tr')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

alter table customers enable row level security;

create policy "staff can read customers"
  on customers for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage customers"
  on customers for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index customers_name_idx on customers (name);
create index customers_email_idx on customers (email);
create index customers_phone_idx on customers (phone);
