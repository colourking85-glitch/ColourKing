-- 0021: Email log table for IMAP poller
-- Stores captured incoming email replies matched to leads/jobs

CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'lead',
  entity_id uuid,
  from_email text NOT NULL,
  subject text,
  snippet text,
  message_id text,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_entity ON email_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_email_log_message_id ON email_log(message_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read email_log"
  ON email_log FOR SELECT USING (is_active_staff());

CREATE POLICY "staff can insert email_log"
  ON email_log FOR INSERT WITH CHECK (is_active_staff());
