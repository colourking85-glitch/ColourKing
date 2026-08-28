-- 0046: INS module — database guards (immutability enforcement)

-- Transaction-scoped escape hatch used ONLY by the transition function
create or replace function ins_in_transition() returns boolean language sql stable as $$
  select coalesce(current_setting('ins.transition', true), 'off') = 'on';
$$;

-- Child tables: writable only while the inspection is in a working status
create or replace function ins_guard_writable() returns trigger language plpgsql as $$
declare v_status text; v_id uuid;
begin
  v_id := case TG_OP when 'DELETE' then old.inspection_id else new.inspection_id end;
  select status into v_status from ins_inspections where id = v_id;
  if v_status is null then return coalesce(new, old); end if;
  if ins_in_transition() then return coalesce(new, old); end if;
  if v_status not in ('CONCEPT','BEZIG') then
    raise exception 'INS_VERGRENDELD: inspectie is % en kan niet worden gewijzigd (%)',
      v_status, TG_TABLE_NAME using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['ins_findings','ins_finding_parts','ins_photos'] loop
    execute format('create trigger %I before insert or update or delete on %I
                    for each row execute function ins_guard_writable()',
                   t || '_guard_writable', t);
  end loop;
end $$;

-- Parent row guard
create or replace function ins_guard_parent() returns trigger language plpgsql as $$
begin
  if ins_in_transition() then return coalesce(new, old); end if;
  if old.status in ('VERGRENDELD','GEANNULEERD') then
    raise exception 'INS_VERGRENDELD: inspectie is % en kan niet worden gewijzigd', old.status
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

create trigger ins_inspections_guard before update or delete on ins_inspections
for each row execute function ins_guard_parent();

-- Evidence is write-once (photos cannot be swapped or deleted)
create or replace function ins_photo_write_once() returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    if new.storage_path is distinct from old.storage_path
       or new.sha256 is distinct from old.sha256 then
      raise exception 'INS_BEWIJS: fotobestand kan niet worden vervangen';
    end if;
    return new;
  end if;
  if exists (select 1 from ins_inspections where id = old.inspection_id) then
    raise exception 'INS_BEWIJS: fotos kunnen niet worden verwijderd';
  end if;
  return old;
end $$;

create trigger ins_photos_write_once before update or delete on ins_photos
for each row execute function ins_photo_write_once();

-- Snapshots: insert-only except the deferred PDF write
create or replace function ins_snapshot_guard() returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'INS_BEWIJS: snapshot kan niet worden verwijderd';
  end if;
  if new.snapshot is distinct from old.snapshot
     or new.snapshot_hash is distinct from old.snapshot_hash then
    raise exception 'INS_BEWIJS: snapshot kan niet worden gewijzigd';
  end if;
  if old.pdf_path is not null then
    raise exception 'INS_BEWIJS: PDF is al vastgelegd';
  end if;
  return new;
end $$;

create trigger ins_snapshots_guard before update or delete on ins_snapshots
for each row execute function ins_snapshot_guard();

-- Reference assignment: server-side, per inspection, under parent row lock
create or replace function ins_assign_reference() returns trigger language plpgsql as $$
declare v_next int; v_prefix text;
begin
  v_prefix := case TG_TABLE_NAME when 'ins_findings' then 'S-' else 'F-' end;
  perform 1 from ins_inspections where id = new.inspection_id for update;
  execute format('select coalesce(max(sequence_no),0)+1 from %I where inspection_id = $1', TG_TABLE_NAME)
    into v_next using new.inspection_id;
  new.sequence_no := v_next;
  new.reference   := v_prefix || lpad(v_next::text, 2, '0');
  return new;
end $$;

create trigger ins_findings_ref before insert on ins_findings
for each row execute function ins_assign_reference();

create trigger ins_photos_ref before insert on ins_photos
for each row execute function ins_assign_reference();

-- Auto-update timestamps
create or replace function ins_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger ins_inspections_touch before update on ins_inspections
for each row execute function ins_touch();

create trigger ins_findings_touch before update on ins_findings
for each row execute function ins_touch();
