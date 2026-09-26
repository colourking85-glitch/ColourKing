-- 0062: INS phase 1 — make the inspection flow work end to end
--
-- * plate_country column (wizard already sends it)
-- * counters (finding_count / photo_count / total_hours) maintained by trigger
-- * ins_transition(): the only path that changes status. SECURITY DEFINER so
--   the RLS "draft only" update policy stays as the guard for ordinary edits.
-- * ins_approve(): the only path that writes ins_approvals
-- * AKKOORD freezes a snapshot and locks (VERGRENDELD) in the same call

-- ── 1. plate_country ────────────────────────────────────────
alter table ins_inspections
  add column if not exists plate_country text not null default 'NL';

alter table ins_inspections
  drop constraint if exists ins_plate_country_chk;
alter table ins_inspections
  add constraint ins_plate_country_chk check (plate_country ~ '^[A-Z]{2}$');

-- ── 2. counters ─────────────────────────────────────────────
create or replace function ins_recount(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_prev text;
begin
  v_prev := coalesce(current_setting('ins.transition', true), 'off');
  perform set_config('ins.transition', 'on', true);
  update ins_inspections i set
    finding_count = (select count(*) from ins_findings f where f.inspection_id = i.id),
    photo_count   = (select count(*) from ins_photos p where p.inspection_id = i.id),
    total_hours   = (select coalesce(sum(f.repair_hours + f.paint_hours), 0)
                     from ins_findings f where f.inspection_id = i.id and f.origin = 'schade')
  where i.id = p_id;
  perform set_config('ins.transition', v_prev, true);
end $$;

create or replace function ins_recount_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform ins_recount(coalesce(new.inspection_id, old.inspection_id));
  return null;
end $$;

drop trigger if exists ins_findings_recount on ins_findings;
create trigger ins_findings_recount
  after insert or update or delete on ins_findings
  for each row execute function ins_recount_trigger();

drop trigger if exists ins_photos_recount on ins_photos;
create trigger ins_photos_recount
  after insert or delete on ins_photos
  for each row execute function ins_recount_trigger();

-- backfill existing rows
do $$
declare r record;
begin
  for r in select id from ins_inspections loop
    perform ins_recount(r.id);
  end loop;
end $$;

-- ── 3. snapshot builder ─────────────────────────────────────
create or replace function ins_build_snapshot(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'inspection', to_jsonb(i) - 'rdw_payload' - 'updated_at',
    'findings', (select coalesce(jsonb_agg(to_jsonb(f) - 'updated_at' order by f.sequence_no), '[]'::jsonb)
                 from ins_findings f where f.inspection_id = i.id),
    'parts', (select coalesce(jsonb_agg(to_jsonb(fp)), '[]'::jsonb)
              from ins_finding_parts fp where fp.inspection_id = i.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object(
                 'id', p.id, 'reference', p.reference, 'kind', p.kind, 'finding_id', p.finding_id,
                 'shot_key', p.shot_key, 'sha256', p.sha256, 'bytes', p.bytes, 'captured_at', p.captured_at
               ) order by p.sequence_no), '[]'::jsonb)
               from ins_photos p where p.inspection_id = i.id),
    'approvals', (select coalesce(jsonb_agg(jsonb_build_object(
                    'role', a.role, 'signer_name', a.signer_name, 'signed_at', a.signed_at,
                    'document_hash', a.document_hash
                  ) order by a.signed_at), '[]'::jsonb)
                  from ins_approvals a where a.inspection_id = i.id)
  )
  from ins_inspections i where i.id = p_id;
$$;

-- ── 4. transition ───────────────────────────────────────────
create or replace function ins_transition(p_id uuid, p_to text, p_payload jsonb default '{}'::jsonb)
returns ins_inspections
language plpgsql security definer set search_path = public as $$
declare
  v_row      ins_inspections;
  v_actor    uuid := auth.uid();
  v_from     text;
  v_prev     text;
  v_snapshot jsonb;
begin
  if v_actor is null or not exists (select 1 from staff s where s.id = v_actor and s.active) then
    raise exception 'INS_AUTH: alleen actieve medewerkers kunnen een inspectie wijzigen'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_row from ins_inspections where id = p_id and deleted_at is null for update;
  if not found then
    raise exception 'INS_NOT_FOUND: inspectie niet gevonden' using errcode = 'no_data_found';
  end if;
  v_from := v_row.status;

  -- mirrors src/modules/inspectie/machine.ts
  if not ((v_from, p_to) in (
    ('CONCEPT','BEZIG'),
    ('BEZIG','TER_AKKOORD'),
    ('TER_AKKOORD','AKKOORD'),
    ('TER_AKKOORD','BEZIG'),
    ('CONCEPT','GEANNULEERD'),
    ('BEZIG','GEANNULEERD'),
    ('TER_AKKOORD','GEANNULEERD'),
    ('AKKOORD','VERGRENDELD')
  )) then
    raise exception 'INS_TRANSITION: overgang % -> % is niet toegestaan', v_from, p_to
      using errcode = 'check_violation';
  end if;

  perform ins_recount(p_id);

  -- guards
  if p_to = 'TER_AKKOORD' and not exists (
    select 1 from ins_findings f where f.inspection_id = p_id and f.origin = 'schade'
  ) then
    raise exception 'INS_GUARD: minstens één schadebevinding is vereist'
      using errcode = 'check_violation';
  end if;

  if p_to = 'AKKOORD' and not exists (
    select 1 from ins_approvals a where a.inspection_id = p_id and a.role = 'inspecteur'
  ) then
    raise exception 'INS_GUARD: akkoord van de inspecteur is vereist'
      using errcode = 'check_violation';
  end if;

  v_prev := coalesce(current_setting('ins.transition', true), 'off');
  perform set_config('ins.transition', 'on', true);

  update ins_inspections set
    status       = p_to,
    submitted_at = case when p_to = 'TER_AKKOORD' then now() else submitted_at end,
    locked_at    = case when p_to = 'VERGRENDELD' then now() else locked_at end
  where id = p_id
  returning * into v_row;

  insert into ins_events (inspection_id, event_type, actor_id, payload)
  values (p_id, 'status_' || lower(p_to), v_actor,
          coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('from', v_from, 'to', p_to));

  if p_to = 'AKKOORD' then
    v_snapshot := ins_build_snapshot(p_id);
    insert into ins_snapshots (inspection_id, snapshot, snapshot_hash)
    values (p_id, v_snapshot, encode(sha256(convert_to(v_snapshot::text, 'UTF8')), 'hex'));
    perform set_config('ins.transition', v_prev, true);
    return ins_transition(p_id, 'VERGRENDELD', '{}'::jsonb);
  end if;

  perform set_config('ins.transition', v_prev, true);
  return v_row;
end $$;

-- ── 5. approval ─────────────────────────────────────────────
create or replace function ins_approve(
  p_id             uuid,
  p_role           text,
  p_signer_name    text,
  p_identification text,
  p_statement_text text,
  p_signature_path text default null,
  p_signer_email   text default null,
  p_ip_address     inet default null,
  p_user_agent     text default null
) returns ins_approvals
language plpgsql security definer set search_path = public as $$
declare
  v_actor  uuid := auth.uid();
  v_status text;
  v_hash   text;
  v_row    ins_approvals;
begin
  if v_actor is null or not exists (select 1 from staff s where s.id = v_actor and s.active) then
    raise exception 'INS_AUTH: alleen actieve medewerkers kunnen een akkoord vastleggen'
      using errcode = 'insufficient_privilege';
  end if;
  if p_role not in ('inspecteur', 'klant') then
    raise exception 'INS_APPROVAL: onbekende rol %', p_role using errcode = 'check_violation';
  end if;
  if coalesce(trim(p_signer_name), '') = '' then
    raise exception 'INS_APPROVAL: naam van ondertekenaar is vereist' using errcode = 'check_violation';
  end if;

  select status into v_status from ins_inspections where id = p_id and deleted_at is null for update;
  if v_status is null then
    raise exception 'INS_NOT_FOUND: inspectie niet gevonden' using errcode = 'no_data_found';
  end if;
  if v_status <> 'TER_AKKOORD' then
    raise exception 'INS_APPROVAL: akkoord alleen mogelijk in status TER_AKKOORD (nu %)', v_status
      using errcode = 'check_violation';
  end if;
  if exists (select 1 from ins_approvals a where a.inspection_id = p_id and a.role = p_role) then
    raise exception 'INS_APPROVAL: rol % heeft al getekend', p_role using errcode = 'unique_violation';
  end if;

  v_hash := encode(sha256(convert_to((ins_build_snapshot(p_id) - 'approvals')::text, 'UTF8')), 'hex');

  insert into ins_approvals (
    inspection_id, role, signer_name, signer_user_id, signer_email,
    identification, statement_text, signature_path, document_hash, ip_address, user_agent
  ) values (
    p_id, p_role, trim(p_signer_name),
    case when p_role = 'inspecteur' then v_actor else null end,
    p_signer_email, p_identification, p_statement_text, p_signature_path, v_hash, p_ip_address, p_user_agent
  ) returning * into v_row;

  insert into ins_events (inspection_id, event_type, actor_id, payload)
  values (p_id, 'approval_' || p_role, v_actor,
          jsonb_build_object('approval_id', v_row.id, 'signer_name', v_row.signer_name, 'document_hash', v_hash));

  return v_row;
end $$;

-- ── 6. grants ───────────────────────────────────────────────
revoke all on function ins_recount(uuid) from public;
revoke all on function ins_build_snapshot(uuid) from public;
revoke all on function ins_transition(uuid, text, jsonb) from public;
revoke all on function ins_approve(uuid, text, text, text, text, text, text, inet, text) from public;

grant execute on function ins_transition(uuid, text, jsonb) to authenticated;
grant execute on function ins_approve(uuid, text, text, text, text, text, text, inet, text) to authenticated;
