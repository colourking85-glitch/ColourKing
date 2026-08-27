-- 0022: Add body_type column to vehicles if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'body_type'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN body_type text;
  END IF;
END $$;
