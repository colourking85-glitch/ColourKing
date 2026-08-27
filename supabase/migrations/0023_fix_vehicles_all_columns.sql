-- 0023: Add ALL potentially missing columns to vehicles table
-- The original migration 0006 was not fully applied to production

DO $$ BEGIN
  -- kenteken
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='kenteken') THEN
    ALTER TABLE vehicles ADD COLUMN kenteken text;
  END IF;
  -- vin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='vin') THEN
    ALTER TABLE vehicles ADD COLUMN vin text;
  END IF;
  -- make
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='make') THEN
    ALTER TABLE vehicles ADD COLUMN make text;
  END IF;
  -- model
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='model') THEN
    ALTER TABLE vehicles ADD COLUMN model text;
  END IF;
  -- year
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='year') THEN
    ALTER TABLE vehicles ADD COLUMN year int;
  END IF;
  -- colour
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='colour') THEN
    ALTER TABLE vehicles ADD COLUMN colour text;
  END IF;
  -- paint_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='paint_code') THEN
    ALTER TABLE vehicles ADD COLUMN paint_code text;
  END IF;
  -- fuel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='fuel') THEN
    ALTER TABLE vehicles ADD COLUMN fuel text;
  END IF;
  -- body_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='body_type') THEN
    ALTER TABLE vehicles ADD COLUMN body_type text;
  END IF;
  -- rdw_snapshot
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='rdw_snapshot') THEN
    ALTER TABLE vehicles ADD COLUMN rdw_snapshot jsonb;
  END IF;
  -- wok
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='wok') THEN
    ALTER TABLE vehicles ADD COLUMN wok boolean NOT NULL DEFAULT false;
  END IF;
  -- deleted_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='deleted_at') THEN
    ALTER TABLE vehicles ADD COLUMN deleted_at timestamptz;
  END IF;
  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='updated_at') THEN
    ALTER TABLE vehicles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='created_at') THEN
    ALTER TABLE vehicles ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS vehicles_customer_id_idx ON vehicles (customer_id);
CREATE INDEX IF NOT EXISTS vehicles_kenteken_idx ON vehicles (kenteken);
