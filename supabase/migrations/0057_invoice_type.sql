-- Add invoice_type column to invoices table
-- 'standard' = regular invoice, 'deposit' = voorschot/aanbetaling
alter table invoices
  add column invoice_type text not null default 'standard'
  check (invoice_type in ('standard', 'deposit'));

comment on column invoices.invoice_type is 'standard = regular invoice, deposit = voorschot/aanbetaling';
