-- Sprint 6: Signatures table + gallery_consent column on documents

-- Signatures table for tablet signature capture
CREATE TABLE signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id),
  signer_name text NOT NULL,
  signer_role text NOT NULL DEFAULT 'customer',  -- 'customer' | 'staff'
  signature_data text NOT NULL,                   -- base64 PNG data
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by document
CREATE INDEX idx_signatures_document_id ON signatures(document_id);

-- RLS: staff only
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view signatures"
  ON signatures FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can insert signatures"
  ON signatures FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

-- Gallery consent on documents (for handover notes)
ALTER TABLE documents ADD COLUMN gallery_consent boolean;
