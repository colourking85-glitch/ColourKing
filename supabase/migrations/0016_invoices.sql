-- 0016: invoices, invoice_lines, payments tables

-- Invoices table
create table invoices (
  id                  uuid primary key default gen_random_uuid(),
  invoice_number      text unique,
  status              invoice_status not null default 'draft',

  customer_id         uuid not null references customers(id),
  vehicle_id          uuid references vehicles(id),
  job_id              uuid references jobs(id),
  offer_id            uuid references offers(id),

  locale              text not null default 'nl',

  subtotal_cents      int not null default 0,
  vat_cents           int not null default 0,
  total_cents         int not null default 0,
  discount_cents      int not null default 0,
  tax_summary         jsonb,

  due_date            date,
  paid_at             timestamptz,
  payment_method      payment_method,
  payment_reference   text,
  mollie_payment_id   text,

  notes               text,
  terms               text,

  created_by          uuid references staff(id),
  issued_at           timestamptz,
  issued_by           uuid references staff(id),
  sent_at             timestamptz,
  cancelled_at        timestamptz,

  credit_note_id      uuid references invoices(id),
  payment_token       text unique,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

alter table invoices enable row level security;

create policy "staff can read invoices"
  on invoices for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage invoices"
  on invoices for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index invoices_customer_id_idx on invoices (customer_id);
create index invoices_vehicle_id_idx on invoices (vehicle_id);
create index invoices_job_id_idx on invoices (job_id);
create index invoices_offer_id_idx on invoices (offer_id);
create index invoices_status_idx on invoices (status);
create index invoices_mollie_payment_id_idx on invoices (mollie_payment_id);
create index invoices_credit_note_id_idx on invoices (credit_note_id);
create index invoices_payment_token_idx on invoices (payment_token);

-- Invoice lines table
create table invoice_lines (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null references invoices(id) on delete cascade,
  sort_order          int not null default 0,
  kind                offer_line_kind not null default 'labour',
  description         text not null,
  quantity            numeric not null default 1,
  unit                text not null default 'st',
  unit_price_cents    int not null default 0,
  discount_pct        numeric not null default 0,
  line_total_cents    int not null default 0,
  tax_code            tax_code not null default 'H21',
  vat_amount_cents    int not null default 0,
  part_number         text,
  created_at          timestamptz not null default now()
);

alter table invoice_lines enable row level security;

create policy "staff can read invoice_lines"
  on invoice_lines for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage invoice_lines"
  on invoice_lines for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index invoice_lines_invoice_id_idx on invoice_lines (invoice_id);

-- Payments table
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null references invoices(id),
  amount_cents        int not null,
  method              payment_method not null,
  reference           text,
  mollie_payment_id   text,
  mollie_status       text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table payments enable row level security;

create policy "staff can read payments"
  on payments for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage payments"
  on payments for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index payments_invoice_id_idx on payments (invoice_id);
create index payments_mollie_payment_id_idx on payments (mollie_payment_id);
