-- 0044: INS module — inspections, findings, parts, photos, derivatives

create table ins_inspections (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique default ins_next_reference(),
  vehicle_id             uuid not null references vehicles(id),
  customer_id            uuid references customers(id),
  job_id                 uuid references jobs(id),
  parent_inspection_id   uuid references ins_inspections(id),
  status                 text not null default 'CONCEPT',
  purpose                text not null default 'particulier',

  -- vehicle context captured at step 01
  licence_plate          text not null,
  vin                    text,
  make                   text,
  model                  text,
  first_reg_date         date,
  fuel                   text,
  odometer_km            int,
  rdw_verified           boolean not null default false,
  rdw_payload            jsonb,

  -- damage context
  event_date             date,
  event_description      text,
  insurer_name           text,
  claim_number           text,

  -- computed at submit, frozen at lock
  finding_count          int not null default 0,
  photo_count            int not null default 0,
  total_hours            numeric(10,2) not null default 0,
  indicative_total_cents integer,

  inspector_id           uuid not null references staff(id) on delete restrict,
  started_at             timestamptz not null default now(),
  submitted_at           timestamptz,
  locked_at              timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid not null references staff(id) on delete restrict,
  deleted_at             timestamptz,

  constraint ins_status_chk check (status in
    ('CONCEPT','BEZIG','TER_AKKOORD','AKKOORD','VERGRENDELD','GEANNULEERD')),
  constraint ins_purpose_chk check (purpose in ('particulier','verzekering','intern'))
);

create index ins_inspections_vehicle_idx on ins_inspections (vehicle_id, created_at desc);
create index ins_inspections_status_idx on ins_inspections (status) where deleted_at is null;
create index ins_inspections_customer_idx on ins_inspections (customer_id);
create index ins_inspections_job_idx on ins_inspections (job_id);

-- Findings
create table ins_findings (
  id                     uuid primary key,
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  reference              text not null,
  sequence_no            int not null,
  component_key          text not null references ins_components(key),
  hotspot_point          jsonb,
  sub_location           text,
  damage_types           text[] not null default '{}',
  severity               int not null default 2,
  origin                 text not null default 'schade',
  disposition            text not null default 'herstellen',

  repair_hours           numeric(6,2) not null default 0,
  repair_technique       text,
  paint_required         boolean not null default false,
  paint_operation        text,
  paint_hours            numeric(6,2) not null default 0,
  blend_components       text[] not null default '{}',

  hidden_damage_possible boolean not null default false,
  hidden_damage_note     text,
  adas_possible          boolean not null default false,
  description            text,
  created_at             timestamptz not null default now(),
  created_by             uuid not null references staff(id),
  updated_at             timestamptz not null default now(),

  unique (inspection_id, reference),
  unique (inspection_id, sequence_no),

  constraint ins_f_sev_chk     check (severity between 1 and 4),
  constraint ins_f_origin_chk  check (origin in ('schade','pre_existent')),
  constraint ins_f_disp_chk    check (disposition in ('herstellen','vervangen','onderzoeken','geen_actie')),
  constraint ins_f_paintop_chk check (paint_operation is null or paint_operation in
                                  ('spot','paneel','inspuiten','polijsten')),
  constraint ins_f_tech_chk    check (repair_technique is null or repair_technique in
                                  ('uitdeuken','uitdeuken_plamuren','richten','vervangen'))
);

create index ins_findings_inspection_idx on ins_findings (inspection_id, sequence_no);

-- Parts per finding
create table ins_finding_parts (
  id                     uuid primary key default gen_random_uuid(),
  finding_id             uuid not null references ins_findings(id) on delete cascade,
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  description            text not null,
  part_number            text,
  qty                    numeric(8,2) not null default 1,
  unit_price_cents       integer,
  source                 text not null default 'nieuw',
  constraint ins_part_src_chk check (source in ('nieuw','gebruikt','imitatie'))
);

-- Photos
create table ins_photos (
  id                     uuid primary key,
  inspection_id          uuid not null references ins_inspections(id) on delete cascade,
  reference              text not null,
  sequence_no            int not null,
  finding_id             uuid references ins_findings(id) on delete set null,
  shot_key               text,
  kind                   text not null default 'schade',
  storage_path           text not null,
  mime_type              text not null,
  bytes                  bigint not null,
  sha256                 text not null,
  captured_at            timestamptz not null,
  captured_by            uuid not null references staff(id),
  caption                text,
  created_at             timestamptz not null default now(),

  unique (inspection_id, reference),
  unique (inspection_id, sequence_no),
  constraint ins_photo_kind_chk check (kind in ('shot','schade','pre_existent','document'))
);

create index ins_photos_finding_idx on ins_photos (finding_id);

-- Photo derivatives (writable after lock — needed for report renditions)
create table ins_photo_derivatives (
  id                     uuid primary key default gen_random_uuid(),
  photo_id               uuid not null references ins_photos(id) on delete cascade,
  variant                text not null,
  storage_path           text not null,
  generated_at           timestamptz not null default now(),
  unique (photo_id, variant),
  constraint ins_photo_var_chk check (variant in ('thumb','report'))
);
