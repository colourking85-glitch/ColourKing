-- Internal notes / chat messages per record
CREATE TABLE internal_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('job', 'lead', 'customer', 'vehicle', 'invoice', 'offer')),
  entity_id   uuid NOT NULL,
  author_id   uuid REFERENCES staff(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_entity ON internal_notes (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_notes_author ON internal_notes (author_id);

ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all notes"
  ON internal_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create notes"
  ON internal_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);
