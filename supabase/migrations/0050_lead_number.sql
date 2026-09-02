-- 0050: Add sequential number to leads for human-readable IDs (LD-0001)
ALTER TABLE leads ADD COLUMN number serial UNIQUE;

-- Backfill existing leads in creation order
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM leads
)
UPDATE leads SET number = numbered.rn
FROM numbered WHERE leads.id = numbered.id;

-- Reset sequence to max + 1
SELECT setval(pg_get_serial_sequence('leads', 'number'), COALESCE(MAX(number), 0) + 1, false) FROM leads;
