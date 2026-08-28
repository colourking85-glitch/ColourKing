-- 0034: Add share_token to documents for public handover note access

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_share_token
  ON documents(share_token) WHERE share_token IS NOT NULL;
