-- 0033: add appointment-related fields to leads
-- Public booking requests now flow through leads for staff review
-- before being promoted to actual appointments.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_time time;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location_address text;
