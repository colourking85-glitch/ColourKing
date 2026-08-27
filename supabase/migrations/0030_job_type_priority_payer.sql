-- 0030: add job_type, priority, payer_type, estimated_hours, target_date to jobs

CREATE TYPE job_type AS ENUM ('bodywork', 'mechanical', 'paint', 'electrical', 'diagnostics', 'apk', 'maintenance');
CREATE TYPE job_priority AS ENUM ('normal', 'urgent', 'rush');
CREATE TYPE payer_type AS ENUM ('casco', 'wa', 'particulier', 'lease');

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS job_type job_type DEFAULT 'bodywork',
  ADD COLUMN IF NOT EXISTS priority job_priority DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS payer_type payer_type,
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(6,1),
  ADD COLUMN IF NOT EXISTS target_date date;
