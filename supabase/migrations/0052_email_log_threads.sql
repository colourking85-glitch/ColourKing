-- 0052: Two-way email threads on email_log.
-- email_log held only inbound replies captured by the IMAP poller. It now
-- also records emails sent to customers from a lead, so the lead detail page
-- can show the full conversation and replies can be matched by In-Reply-To.
-- The last inbox poll time lives in settings (key 'email_poll_state').

ALTER TABLE email_log ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound';
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS to_email text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS body_text text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS in_reply_to text;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE email_log ADD CONSTRAINT email_log_direction_check
    CHECK (direction IN ('inbound', 'outbound'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_log_entity_time
  ON email_log (entity_type, entity_id, received_at);
