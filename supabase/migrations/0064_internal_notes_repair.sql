-- 0064: repair drift — internal_notes (0019) and jobs.outtake_km (0008) are
-- missing on the live database. Idempotent re-assertion so the shared
-- NotesPanel (vehicle notes on VH10) and job delivery mileage work.

CREATE TABLE IF NOT EXISTS internal_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('job', 'lead', 'customer', 'vehicle', 'invoice', 'offer')),
  entity_id   uuid NOT NULL,
  author_id   uuid REFERENCES staff(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_entity ON internal_notes (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_author ON internal_notes (author_id);

ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read all notes" ON internal_notes;
CREATE POLICY "Staff can read all notes"
  ON internal_notes FOR SELECT
  USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));

DROP POLICY IF EXISTS "Staff can create notes" ON internal_notes;
CREATE POLICY "Staff can create notes"
  ON internal_notes FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS outtake_km int;
