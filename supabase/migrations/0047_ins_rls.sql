-- 0047: INS module — Row Level Security

-- ins_inspections
alter table ins_inspections enable row level security;

create policy "staff can read inspections"
  on ins_inspections for select
  using (deleted_at is null and auth.uid() in (select s.id from staff s where s.active));

create policy "staff can insert inspections"
  on ins_inspections for insert
  with check (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can update draft inspections"
  on ins_inspections for update
  using (status in ('CONCEPT','BEZIG')
         and auth.uid() in (select s.id from staff s where s.active))
  with check (status in ('CONCEPT','BEZIG'));

-- ins_findings
alter table ins_findings enable row level security;

create policy "staff can read findings"
  on ins_findings for select
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can insert findings"
  on ins_findings for insert
  with check (exists (select 1 from ins_inspections i
                      where i.id = inspection_id and i.status in ('CONCEPT','BEZIG')
                      and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can update findings"
  on ins_findings for update
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.status in ('CONCEPT','BEZIG')
                 and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can delete findings"
  on ins_findings for delete
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.status in ('CONCEPT','BEZIG')
                 and auth.uid() in (select s.id from staff s where s.active)));

-- ins_finding_parts
alter table ins_finding_parts enable row level security;

create policy "staff can read finding parts"
  on ins_finding_parts for select
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can manage finding parts"
  on ins_finding_parts for all
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.status in ('CONCEPT','BEZIG')
                 and auth.uid() in (select s.id from staff s where s.active)));

-- ins_photos
alter table ins_photos enable row level security;

create policy "staff can read photos"
  on ins_photos for select
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can insert photos"
  on ins_photos for insert
  with check (exists (select 1 from ins_inspections i
                      where i.id = inspection_id and i.status in ('CONCEPT','BEZIG')
                      and auth.uid() in (select s.id from staff s where s.active)));

-- ins_photo_derivatives (writable even after lock for report renditions)
alter table ins_photo_derivatives enable row level security;

create policy "staff can read derivatives"
  on ins_photo_derivatives for select
  using (exists (select 1 from ins_photos p
                 join ins_inspections i on i.id = p.inspection_id
                 where p.id = photo_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

create policy "staff can manage derivatives"
  on ins_photo_derivatives for all
  using (auth.uid() in (select s.id from staff s where s.active));

-- ins_approvals (writes go through transition function only)
alter table ins_approvals enable row level security;

create policy "staff can read approvals"
  on ins_approvals for select
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

-- ins_snapshots (writes go through transition function only)
alter table ins_snapshots enable row level security;

create policy "staff can read snapshots"
  on ins_snapshots for select
  using (exists (select 1 from ins_inspections i
                 where i.id = inspection_id and i.deleted_at is null
                 and auth.uid() in (select s.id from staff s where s.active)));

-- ins_share_tokens
alter table ins_share_tokens enable row level security;

create policy "staff can read share tokens"
  on ins_share_tokens for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "staff can create share tokens"
  on ins_share_tokens for insert
  with check (auth.uid() in (select s.id from staff s where s.active));

-- ins_events (append-only, reads by staff)
alter table ins_events enable row level security;

create policy "staff can read events"
  on ins_events for select
  using (auth.uid() in (select s.id from staff s where s.active));

-- ins_components + ins_damage_types (catalog — read by all authenticated)
alter table ins_components enable row level security;

create policy "authenticated can read components"
  on ins_components for select
  using (auth.uid() is not null);

create policy "admin can manage components"
  on ins_components for all
  using (exists (select 1 from staff s where s.id = auth.uid() and s.active and s.role = 'admin'));

alter table ins_damage_types enable row level security;

create policy "authenticated can read damage types"
  on ins_damage_types for select
  using (auth.uid() is not null);

create policy "admin can manage damage types"
  on ins_damage_types for all
  using (exists (select 1 from staff s where s.id = auth.uid() and s.active and s.role = 'admin'));
