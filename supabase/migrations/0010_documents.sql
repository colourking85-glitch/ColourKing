-- 0010: documents + number_ranges tables, allocate_number() function

-- Number ranges: per doc_type, per year, gapless sequences
create table number_ranges (
  id            uuid primary key default gen_random_uuid(),
  doc_type      doc_type not null,
  year          int not null,
  prefix        text not null,
  next_number   int not null default 1,
  created_at    timestamptz not null default now(),
  unique (doc_type, year)
);

alter table number_ranges enable row level security;

create policy "staff can read number_ranges"
  on number_ranges for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage number_ranges"
  on number_ranges for all
  using (auth.uid() in (select s.id from staff s where s.active and s.role in ('admin', 'office')))
  with check (auth.uid() in (select s.id from staff s where s.active and s.role in ('admin', 'office')));

-- Seed default prefixes for current year
insert into number_ranges (doc_type, year, prefix) values
  ('offer',         2026, 'OFF'),
  ('repair_order',  2026, 'OPD'),
  ('handover_note', 2026, 'AFL'),
  ('invoice',       2026, 'FAC'),
  ('credit_note',   2026, 'CRE');

-- allocate_number: gapless allocation within a transaction
-- Returns formatted number like 'OFF-2026-00123'
create or replace function allocate_number(p_doc_type doc_type, p_year int default null)
returns text
language plpgsql
as $$
declare
  v_year int;
  v_prefix text;
  v_num int;
begin
  v_year := coalesce(p_year, extract(year from now())::int);

  -- Lock the row for update to prevent concurrent allocation gaps
  select prefix, next_number into v_prefix, v_num
  from number_ranges
  where doc_type = p_doc_type and year = v_year
  for update;

  -- Auto-create range if year doesn't exist yet
  if not found then
    select prefix into v_prefix
    from number_ranges
    where doc_type = p_doc_type
    order by year desc limit 1;

    if v_prefix is null then
      v_prefix := upper(left(p_doc_type::text, 3));
    end if;

    insert into number_ranges (doc_type, year, prefix, next_number)
    values (p_doc_type, v_year, v_prefix, 2)
    returning next_number - 1 into v_num;
  else
    update number_ranges
    set next_number = next_number + 1
    where doc_type = p_doc_type and year = v_year;
  end if;

  return v_prefix || '-' || v_year::text || '-' || lpad(v_num::text, 5, '0');
end;
$$;

-- Documents table
create table documents (
  id              uuid primary key default gen_random_uuid(),
  doc_type        doc_type not null,
  doc_number      text unique,
  status          doc_status not null default 'draft',
  supersedes_id   uuid references documents(id),

  job_id          uuid references jobs(id),
  offer_id        uuid,
  invoice_id      uuid,
  customer_id     uuid not null references customers(id),
  vehicle_id      uuid references vehicles(id),

  locale          text not null default 'nl',
  payload         jsonb,
  pdf_path        text,
  pdf_sha256      text,

  issued_at       timestamptz,
  issued_by       uuid references staff(id),
  sent_at         timestamptz,

  signed_at       timestamptz,
  signed_by_name  text,
  signature_path  text,
  signed_ip       text,

  cancelled_at    timestamptz,
  cancel_reason   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

alter table documents enable row level security;

create policy "staff can read documents"
  on documents for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can manage documents"
  on documents for all
  using (auth.uid() in (select s.id from staff s where s.active))
  with check (auth.uid() in (select s.id from staff s where s.active));

create index documents_doc_type_idx on documents (doc_type);
create index documents_status_idx on documents (status);
create index documents_customer_id_idx on documents (customer_id);
create index documents_vehicle_id_idx on documents (vehicle_id);
create index documents_job_id_idx on documents (job_id);
create index documents_issued_at_idx on documents (issued_at);
create index documents_supersedes_id_idx on documents (supersedes_id);
