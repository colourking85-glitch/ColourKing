-- 0055: Add ip_hash to site_sessions for identifying own test sessions.
-- SHA-256 hash of the visitor IP — not the raw IP, for privacy.
-- Staff can delete sessions (to clean up own test traffic).

ALTER TABLE site_sessions ADD COLUMN IF NOT EXISTS ip_hash text;

CREATE INDEX IF NOT EXISTS site_sessions_ip_hash_idx ON site_sessions (ip_hash);

-- Allow staff to delete sessions (pageviews cascade)
CREATE POLICY "staff can delete site_sessions"
  ON site_sessions FOR DELETE
  USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));
