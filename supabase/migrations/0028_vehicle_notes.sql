-- 0028: add notes column to vehicles for extra definitions/remarks
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS notes text;
