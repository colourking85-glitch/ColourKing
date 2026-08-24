-- 0004: RLS policies for staff and settings

-- Staff: any active staff member can read all staff
create policy "staff can read staff"
  on staff for select
  using (auth.uid() in (select s.id from staff s where s.active));

-- Staff: only admins can insert/update/delete staff
create policy "admin can manage staff"
  on staff for all
  using (exists (
    select 1 from staff s
    where s.id = auth.uid() and s.active and s.role = 'admin'
  ))
  with check (exists (
    select 1 from staff s
    where s.id = auth.uid() and s.active and s.role = 'admin'
  ));

-- Settings: any active staff can read
create policy "staff can read settings"
  on settings for select
  using (auth.uid() in (select s.id from staff s where s.active));

-- Settings: only admin can write
create policy "admin can manage settings"
  on settings for all
  using (exists (
    select 1 from staff s
    where s.id = auth.uid() and s.active and s.role = 'admin'
  ))
  with check (exists (
    select 1 from staff s
    where s.id = auth.uid() and s.active and s.role = 'admin'
  ));
