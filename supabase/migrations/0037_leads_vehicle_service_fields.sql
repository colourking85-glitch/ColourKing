-- 0037: add vehicle details and service selection fields to leads
-- Supports the enhanced public offerte page with RDW lookup,
-- manual brand/model entry for foreign plates, and service/location selection.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_make text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_year integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_colour text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vehicle_vin text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS paint_code text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_foreign_plate boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS repair_locations text[] NOT NULL DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rdw_snapshot jsonb;
