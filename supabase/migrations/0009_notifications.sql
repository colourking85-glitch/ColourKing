-- 0009 Notifications
-- In-app notification system for leads, stage changes, emails, appointments

-- Notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_lead',
    'stage_change',
    'new_email',
    'appointment_confirmed',
    'appointment_cancelled',
    'part_received',
    'payment_received',
    'document_issued',
    'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid REFERENCES staff(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         text NOT NULL,
  body          text,
  link          text,
  ref_type      text,
  ref_id        uuid,
  read          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_staff_unread
  ON notifications (staff_id, read, created_at DESC)
  WHERE read = false;

CREATE INDEX idx_notifications_staff_created
  ON notifications (staff_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_notifications_all"
  ON notifications FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_notifications_own"
  ON notifications FOR ALL TO authenticated
  USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

-- Grants
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;
