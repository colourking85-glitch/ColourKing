-- Add estimated delivery date to jobs
alter table jobs
  add column if not exists estimated_delivery_at timestamptz;

comment on column jobs.estimated_delivery_at is 'Estimated date/time when the vehicle will be ready for delivery';
