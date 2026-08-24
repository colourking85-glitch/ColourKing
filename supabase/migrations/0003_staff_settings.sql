-- 0003: staff + settings tables

-- Helper: auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Staff table — links to auth.users via id
create table staff (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  role        staff_role not null default 'tech',
  locale      text not null default 'nl' check (locale in ('nl', 'en', 'tr')),
  colour      text,
  weekly_hours numeric(4,1) default 40.0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger staff_updated_at
  before update on staff
  for each row execute function update_updated_at();

alter table staff enable row level security;

-- Settings table — key/value store for app config
create table settings (
  key         text primary key,
  value       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger settings_updated_at
  before update on settings
  for each row execute function update_updated_at();

alter table settings enable row level security;

-- Seed default settings
insert into settings (key, value) values
  ('company', '{"name": "ColourKing", "address": "", "postcode": "", "city": "Amsterdam", "phone": "", "email": "", "kvk": "", "vat_number": "", "iban": ""}'::jsonb),
  ('rates', '{"hourly_labour": 7500, "spray_per_panel": 15000}'::jsonb),
  ('numbering', '{"offer_prefix": "OFF", "job_prefix": "OPD", "invoice_prefix": "FAC", "credit_prefix": "CRE", "delivery_prefix": "AFL"}'::jsonb),
  ('vat', '{"default_code": "H21", "rates": {"H21": 21, "L9": 9, "N0": 0}}'::jsonb);
