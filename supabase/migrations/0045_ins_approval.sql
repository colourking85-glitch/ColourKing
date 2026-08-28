-- 0045: INS module — approvals, snapshots, share tokens, audit events

create table ins_approvals (
  id                     uuid primary key default gen_random_uuid(),
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  role                   text not null,
  signer_name            text not null,
  signer_user_id         uuid references staff(id),
  signer_email           text,
  identification         text not null,
  statement_text         text not null,
  signature_path         text,
  document_hash          text not null,
  ip_address             inet,
  user_agent             text,
  signed_at              timestamptz not null default now(),
  constraint ins_appr_role_chk check (role in ('inspecteur','klant')),
  constraint ins_appr_sig_chk  check (role <> 'klant' or signature_path is not null)
);

create table ins_snapshots (
  id                     uuid primary key default gen_random_uuid(),
  inspection_id          uuid not null references ins_inspections(id) on delete cascade unique,
  snapshot               jsonb not null,
  snapshot_hash          text not null,
  pdf_path               text,
  pdf_hash               text,
  created_at             timestamptz not null default now()
);

create table ins_share_tokens (
  id                     uuid primary key default gen_random_uuid(),
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  token_hash             text not null unique,
  recipient_email        text,
  expires_at             timestamptz not null,
  used_at                timestamptz,
  revoked_at             timestamptz,
  created_at             timestamptz not null default now(),
  created_by             uuid not null references staff(id)
);

create table ins_events (
  id                     bigserial primary key,
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  event_type             text not null,
  actor_id               uuid references staff(id),
  payload                jsonb not null default '{}',
  created_at             timestamptz not null default now()
);

create index ins_events_inspection_idx on ins_events (inspection_id, created_at);

-- Append-only rules for audit events
create rule ins_events_no_update as on update to ins_events do instead nothing;
create rule ins_events_no_delete as on delete to ins_events do instead nothing;
