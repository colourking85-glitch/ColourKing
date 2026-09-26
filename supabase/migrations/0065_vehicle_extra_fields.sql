-- 0065: extra vehicle definitions for the bodyshop (VH01 / VH10)
-- paint system, drivetrain, ADAS, key tag, tyre size. All optional.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS paint_type    text,
  ADD COLUMN IF NOT EXISTS transmission  text,
  ADD COLUMN IF NOT EXISTS adas_present  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adas_note     text,
  ADD COLUMN IF NOT EXISTS key_tag       text,
  ADD COLUMN IF NOT EXISTS tyre_size     text;

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_paint_type_chk;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_paint_type_chk
  CHECK (paint_type IS NULL OR paint_type IN ('solid', 'metallic', 'pearl', 'matte', 'unknown'));

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_transmission_chk;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_transmission_chk
  CHECK (transmission IS NULL OR transmission IN ('manual', 'automatic', 'unknown'));
