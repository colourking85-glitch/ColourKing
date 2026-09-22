-- 0051: Soft delete for leads (LD05). Rows are never removed — deleting a
-- lead stamps deleted_at / deleted_by and every list query filters them out.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_active_created_idx
  ON leads (created_at DESC)
  WHERE deleted_at IS NULL;
