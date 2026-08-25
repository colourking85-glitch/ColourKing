-- Sprint 5: Parts table
CREATE TABLE parts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid NOT NULL REFERENCES jobs(id),
  offer_line_id uuid,
  description text NOT NULL,
  part_number text,
  supplier    text,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  status      part_status NOT NULL DEFAULT 'needed',
  ordered_at  timestamptz,
  expected_at date,
  received_at timestamptz,
  blocking    boolean NOT NULL DEFAULT false,
  notes       text,
  created_by  uuid REFERENCES staff(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_parts_job_id   ON parts(job_id);
CREATE INDEX idx_parts_status   ON parts(status);
CREATE INDEX idx_parts_blocking ON parts(blocking) WHERE blocking = true;

-- RLS
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read parts"
  ON parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can insert parts"
  ON parts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can update parts"
  ON parts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can delete parts"
  ON parts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

-- updated_at trigger
CREATE TRIGGER set_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
