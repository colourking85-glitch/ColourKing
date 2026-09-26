-- Reminder emails: one row per (kind, entity, stage) so a reminder is never sent twice.
-- Inserted by the server (service role) only; staff can read.

create type reminder_kind as enum (
  'invoice_due_soon',
  'invoice_overdue',
  'offer_expiring',
  'appointment_reminder',
  'vehicle_ready'
);

create table reminder_log (
  id          uuid primary key default gen_random_uuid(),
  kind        reminder_kind not null,
  entity_type text not null,
  entity_id   uuid not null,
  stage       text not null,
  recipient   text not null,
  locale      text not null default 'nl',
  status      text not null check (status in ('sent', 'skipped', 'failed')),
  message_id  text,
  error       text,
  sent_by     uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (kind, entity_id, stage)
);

create index reminder_log_entity_idx on reminder_log (entity_type, entity_id);
create index reminder_log_created_idx on reminder_log (created_at desc);

alter table reminder_log enable row level security;

create policy reminder_log_staff_select on reminder_log
  for select using (is_active_staff());
