-- 0049: Add tracking code to jobs for customer-facing repair status portal

-- Generate a random 8-character alphanumeric tracking code
create or replace function generate_tracking_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql volatile;

-- Add tracking columns to jobs
alter table jobs
  add column tracking_code text unique,
  add column tracking_enabled boolean not null default true;

-- Backfill existing jobs with tracking codes
update jobs set tracking_code = generate_tracking_code() where tracking_code is null;

-- Make tracking_code not null after backfill
alter table jobs alter column tracking_code set not null;
alter table jobs alter column tracking_code set default generate_tracking_code();

-- Index for fast lookup
create index jobs_tracking_code_idx on jobs (tracking_code);
