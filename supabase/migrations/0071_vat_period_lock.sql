-- 0071: enforce the VAT period lock (spec §14, CLAUDE.md hard rule 4)
--
-- Filing a VAT return (BW05) sets vat_returns.locked = true. Until now only
-- the return row itself was protected; invoices, invoice lines and purchases
-- dated inside a filed period could still be created, issued, edited or
-- deleted. These triggers reject every VAT-relevant write that touches a
-- locked period, whatever code path it comes from.
--
-- Date basis (must match src/lib/vat-period.ts):
--   invoices  -> issued_at in Europe/Amsterdam
--   purchases -> invoice_date
-- Counted invoice statuses (must match VAT_COUNTED_STATUSES):
--   sent, paid, overdue, credited
--
-- Error message: 'VAT_PERIOD_LOCKED:<year>-Q<n>' or 'VAT_PERIOD_LOCKED:<year>-M<nn>'.
--
-- Helpers live in schema `private` so they stay out of the generated
-- public types; trigger functions are SECURITY DEFINER so the lookup does
-- not depend on the caller's RLS or schema grants.

create schema if not exists private;
revoke all on schema private from public;

-- Locked period label for a date, or null when the date is in an open period.
-- A period stays locked after a correction: the corrected original keeps
-- locked = true; corrections are entered in the correction return.
create or replace function private.locked_vat_period(d date)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select v.year::text
         || case when v.period_type = 'quarter'
                 then '-Q' || v.period::text
                 else '-M' || lpad(v.period::text, 2, '0') end
  from public.vat_returns v
  where d is not null
    and v.locked
    and v.year = extract(year from d)::int
    and (
      (v.period_type = 'quarter' and v.period = extract(quarter from d)::int)
      or (v.period_type = 'month' and v.period = extract(month from d)::int)
    )
  limit 1
$$;

create or replace function private.invoice_vat_date(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'Europe/Amsterdam')::date
$$;

-- ─── invoices ───────────────────────────────────────────────────────────────

create or replace function public.invoices_vat_lock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  counted constant invoice_status[] :=
    array['sent', 'paid', 'overdue', 'credited']::invoice_status[];
  old_counted boolean := false;
  new_counted boolean := false;
  p text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    old_counted := old.status = any(counted);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    new_counted := new.status = any(counted);
  end if;

  -- Not VAT-relevant: payment status, sent_at, notes, email fields, crediting.
  if tg_op = 'UPDATE'
     and old_counted = new_counted
     and old.issued_at is not distinct from new.issued_at
     and old.subtotal_cents = new.subtotal_cents
     and old.vat_cents = new.vat_cents
     and old.total_cents = new.total_cents
     and old.discount_cents = new.discount_cents
     and old.tax_summary is not distinct from new.tax_summary then
    return new;
  end if;

  if old_counted then
    p := private.locked_vat_period(private.invoice_vat_date(old.issued_at));
    if p is not null then
      raise exception 'VAT_PERIOD_LOCKED:%', p
        using errcode = 'P0001',
              detail = format('Invoice %s is in filed VAT period %s', coalesce(old.invoice_number, old.id::text), p);
    end if;
  end if;

  if new_counted then
    p := private.locked_vat_period(private.invoice_vat_date(new.issued_at));
    if p is not null then
      raise exception 'VAT_PERIOD_LOCKED:%', p
        using errcode = 'P0001',
              detail = format('Invoice %s would land in filed VAT period %s', coalesce(new.invoice_number, new.id::text), p);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists invoices_vat_lock on public.invoices;
create trigger invoices_vat_lock
  before insert or update or delete on public.invoices
  for each row execute function public.invoices_vat_lock();

-- ─── invoice_lines ──────────────────────────────────────────────────────────

create or replace function public.invoice_lines_vat_lock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv record;
  p text;
  ids uuid[];
  i uuid;
begin
  if tg_op = 'INSERT' then
    ids := array[new.invoice_id];
  elsif tg_op = 'DELETE' then
    ids := array[old.invoice_id];
  else
    ids := array[old.invoice_id, new.invoice_id];
  end if;

  foreach i in array ids loop
    select status, issued_at into inv from public.invoices where id = i;
    if found and inv.status in ('sent', 'paid', 'overdue', 'credited') then
      p := private.locked_vat_period(private.invoice_vat_date(inv.issued_at));
      if p is not null then
        raise exception 'VAT_PERIOD_LOCKED:%', p
          using errcode = 'P0001',
                detail = format('Invoice lines of %s are in filed VAT period %s', i, p);
      end if;
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists invoice_lines_vat_lock on public.invoice_lines;
create trigger invoice_lines_vat_lock
  before insert or update or delete on public.invoice_lines
  for each row execute function public.invoice_lines_vat_lock();

-- ─── purchases ──────────────────────────────────────────────────────────────

create or replace function public.purchases_vat_lock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p text;
begin
  -- Not VAT-relevant: paid, paid_at, payment_method, description, receipt.
  if tg_op = 'UPDATE'
     and old.invoice_date = new.invoice_date
     and old.subtotal_cents = new.subtotal_cents
     and old.vat_cents = new.vat_cents
     and old.total_cents = new.total_cents
     and old.tax_code = new.tax_code then
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    p := private.locked_vat_period(old.invoice_date);
    if p is not null then
      raise exception 'VAT_PERIOD_LOCKED:%', p
        using errcode = 'P0001',
              detail = format('Purchase %s is in filed VAT period %s', old.id, p);
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    p := private.locked_vat_period(new.invoice_date);
    if p is not null then
      raise exception 'VAT_PERIOD_LOCKED:%', p
        using errcode = 'P0001',
              detail = format('Purchase dated %s would land in filed VAT period %s', new.invoice_date, p);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists purchases_vat_lock on public.purchases;
create trigger purchases_vat_lock
  before insert or update or delete on public.purchases
  for each row execute function public.purchases_vat_lock();

-- ─── vat_returns: allow a correction next to the corrected original ─────────
-- correctVatReturn() marks the filed return 'corrected' and inserts a new
-- draft for the same period. The old UNIQUE(period_type, year, period)
-- rejected that insert, so a filed period could never be corrected.
-- One live (non-corrected) return per period; corrected history is kept.

do $$
declare
  c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.vat_returns'::regclass and contype = 'u'
  loop
    execute format('alter table public.vat_returns drop constraint %I', c);
  end loop;
end
$$;

create unique index if not exists vat_returns_live_period_uidx
  on public.vat_returns (period_type, year, period)
  where status <> 'corrected';
