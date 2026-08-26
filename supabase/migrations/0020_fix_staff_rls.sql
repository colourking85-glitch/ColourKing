-- 0020: Fix circular RLS dependency on staff table
-- The staff RLS policy references staff in its own subquery, which Postgres
-- resolves by returning empty (RLS applied recursively), blocking all reads.
-- Fix: SECURITY DEFINER functions that bypass RLS to check staff membership.
-- Each table section is guarded so it only runs if the table exists.

create or replace function is_active_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and active
  )
$$;

create or replace function is_admin_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and active and role = 'admin'
  )
$$;

create or replace function is_office_or_admin_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and active and role in ('admin', 'office')
  )
$$;

-- ── Staff ────────────────────────────────────────────────
drop policy if exists "staff can read staff" on staff;
drop policy if exists "admin can manage staff" on staff;
drop policy if exists "Staff can read own row" on staff;
drop policy if exists "Admin can manage all staff" on staff;

create policy "staff can read staff"
  on staff for select using (is_active_staff());

create policy "admin can manage staff"
  on staff for all
  using (is_admin_staff())
  with check (is_admin_staff());

-- ── Settings ─────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='settings') THEN
  DROP POLICY IF EXISTS "staff can read settings" ON settings;
  DROP POLICY IF EXISTS "admin can manage settings" ON settings;
  DROP POLICY IF EXISTS "Staff can read settings" ON settings;
  DROP POLICY IF EXISTS "Admin can manage settings" ON settings;
  CREATE POLICY "staff can read settings" ON settings FOR SELECT USING (is_active_staff());
  CREATE POLICY "admin can manage settings" ON settings FOR ALL USING (is_admin_staff()) WITH CHECK (is_admin_staff());
END IF;
END $$;

-- ── Customers ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customers') THEN
  DROP POLICY IF EXISTS "staff can read customers" ON customers;
  DROP POLICY IF EXISTS "staff can manage customers" ON customers;
  DROP POLICY IF EXISTS "Staff can read customers" ON customers;
  DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
  CREATE POLICY "staff can read customers" ON customers FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage customers" ON customers FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Vehicles ─────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicles') THEN
  DROP POLICY IF EXISTS "staff can read vehicles" ON vehicles;
  DROP POLICY IF EXISTS "staff can manage vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Staff can read vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Staff can manage vehicles" ON vehicles;
  CREATE POLICY "staff can read vehicles" ON vehicles FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage vehicles" ON vehicles FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Leads ────────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
  DROP POLICY IF EXISTS "staff can read leads" ON leads;
  DROP POLICY IF EXISTS "staff can manage leads" ON leads;
  DROP POLICY IF EXISTS "Staff can read leads" ON leads;
  DROP POLICY IF EXISTS "Staff can manage leads" ON leads;
  CREATE POLICY "staff can read leads" ON leads FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage leads" ON leads FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Lead photos ──────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lead_photos') THEN
  DROP POLICY IF EXISTS "staff can read lead_photos" ON lead_photos;
  DROP POLICY IF EXISTS "staff can manage lead_photos" ON lead_photos;
  DROP POLICY IF EXISTS "Staff can read lead_photos" ON lead_photos;
  DROP POLICY IF EXISTS "Staff can manage lead_photos" ON lead_photos;
  CREATE POLICY "staff can read lead_photos" ON lead_photos FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage lead_photos" ON lead_photos FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Jobs ─────────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='jobs') THEN
  DROP POLICY IF EXISTS "staff can read jobs" ON jobs;
  DROP POLICY IF EXISTS "staff can manage jobs" ON jobs;
  DROP POLICY IF EXISTS "Staff can read jobs" ON jobs;
  DROP POLICY IF EXISTS "Staff can manage jobs" ON jobs;
  CREATE POLICY "staff can read jobs" ON jobs FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage jobs" ON jobs FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Job events ───────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_events') THEN
  DROP POLICY IF EXISTS "staff can read job_events" ON job_events;
  DROP POLICY IF EXISTS "staff can insert job_events" ON job_events;
  DROP POLICY IF EXISTS "Staff can read job_events" ON job_events;
  DROP POLICY IF EXISTS "Staff can insert job_events" ON job_events;
  CREATE POLICY "staff can read job_events" ON job_events FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can insert job_events" ON job_events FOR INSERT WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Job photos ───────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_photos') THEN
  DROP POLICY IF EXISTS "staff can read job_photos" ON job_photos;
  DROP POLICY IF EXISTS "staff can insert job_photos" ON job_photos;
  DROP POLICY IF EXISTS "Staff can read job_photos" ON job_photos;
  DROP POLICY IF EXISTS "Staff can insert job_photos" ON job_photos;
  CREATE POLICY "staff can read job_photos" ON job_photos FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can insert job_photos" ON job_photos FOR INSERT WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Notifications ────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
  DROP POLICY IF EXISTS "staff can read notifications" ON notifications;
  DROP POLICY IF EXISTS "staff can manage notifications" ON notifications;
  DROP POLICY IF EXISTS "Staff can read notifications" ON notifications;
  DROP POLICY IF EXISTS "Staff can manage notifications" ON notifications;
  CREATE POLICY "staff can read notifications" ON notifications FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage notifications" ON notifications FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Number ranges ────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='number_ranges') THEN
  DROP POLICY IF EXISTS "staff can read number_ranges" ON number_ranges;
  DROP POLICY IF EXISTS "office/admin can manage number_ranges" ON number_ranges;
  DROP POLICY IF EXISTS "Staff can read number_ranges" ON number_ranges;
  DROP POLICY IF EXISTS "Office/admin can manage number_ranges" ON number_ranges;
  CREATE POLICY "staff can read number_ranges" ON number_ranges FOR SELECT USING (is_active_staff());
  CREATE POLICY "office/admin can manage number_ranges" ON number_ranges FOR ALL USING (is_office_or_admin_staff()) WITH CHECK (is_office_or_admin_staff());
END IF;
END $$;

-- ── Documents ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN
  DROP POLICY IF EXISTS "staff can read documents" ON documents;
  DROP POLICY IF EXISTS "staff can manage documents" ON documents;
  DROP POLICY IF EXISTS "Staff can read documents" ON documents;
  DROP POLICY IF EXISTS "Staff can manage documents" ON documents;
  CREATE POLICY "staff can read documents" ON documents FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage documents" ON documents FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Resources ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='resources') THEN
  DROP POLICY IF EXISTS "staff can read resources" ON resources;
  DROP POLICY IF EXISTS "staff can manage resources" ON resources;
  DROP POLICY IF EXISTS "Staff can read resources" ON resources;
  DROP POLICY IF EXISTS "Staff can manage resources" ON resources;
  CREATE POLICY "staff can read resources" ON resources FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage resources" ON resources FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Opening hours ────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opening_hours') THEN
  DROP POLICY IF EXISTS "staff can read opening_hours" ON opening_hours;
  DROP POLICY IF EXISTS "staff can manage opening_hours" ON opening_hours;
  DROP POLICY IF EXISTS "Staff can read opening_hours" ON opening_hours;
  DROP POLICY IF EXISTS "Staff can manage opening_hours" ON opening_hours;
  CREATE POLICY "staff can read opening_hours" ON opening_hours FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage opening_hours" ON opening_hours FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Blackouts ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='blackouts') THEN
  DROP POLICY IF EXISTS "staff can read blackouts" ON blackouts;
  DROP POLICY IF EXISTS "staff can manage blackouts" ON blackouts;
  DROP POLICY IF EXISTS "Staff can read blackouts" ON blackouts;
  DROP POLICY IF EXISTS "Staff can manage blackouts" ON blackouts;
  CREATE POLICY "staff can read blackouts" ON blackouts FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage blackouts" ON blackouts FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Appointments ─────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
  DROP POLICY IF EXISTS "staff can read appointments" ON appointments;
  DROP POLICY IF EXISTS "staff can manage appointments" ON appointments;
  DROP POLICY IF EXISTS "Staff can read appointments" ON appointments;
  DROP POLICY IF EXISTS "Staff can manage appointments" ON appointments;
  CREATE POLICY "staff can read appointments" ON appointments FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage appointments" ON appointments FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Job tasks ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_tasks') THEN
  DROP POLICY IF EXISTS "staff can read job_tasks" ON job_tasks;
  DROP POLICY IF EXISTS "staff can manage job_tasks" ON job_tasks;
  DROP POLICY IF EXISTS "Staff can read job_tasks" ON job_tasks;
  DROP POLICY IF EXISTS "Staff can manage job_tasks" ON job_tasks;
  CREATE POLICY "staff can read job_tasks" ON job_tasks FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage job_tasks" ON job_tasks FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Time entries ─────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='time_entries') THEN
  DROP POLICY IF EXISTS "staff can read time_entries" ON time_entries;
  DROP POLICY IF EXISTS "staff can manage time_entries" ON time_entries;
  DROP POLICY IF EXISTS "Staff can read time_entries" ON time_entries;
  DROP POLICY IF EXISTS "Staff can manage time_entries" ON time_entries;
  CREATE POLICY "staff can read time_entries" ON time_entries FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage time_entries" ON time_entries FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Invoices ─────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
  DROP POLICY IF EXISTS "staff can read invoices" ON invoices;
  DROP POLICY IF EXISTS "staff can manage invoices" ON invoices;
  DROP POLICY IF EXISTS "Staff can read invoices" ON invoices;
  DROP POLICY IF EXISTS "Staff can manage invoices" ON invoices;
  CREATE POLICY "staff can read invoices" ON invoices FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage invoices" ON invoices FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Invoice lines ────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoice_lines') THEN
  DROP POLICY IF EXISTS "staff can read invoice_lines" ON invoice_lines;
  DROP POLICY IF EXISTS "staff can manage invoice_lines" ON invoice_lines;
  DROP POLICY IF EXISTS "Staff can read invoice_lines" ON invoice_lines;
  DROP POLICY IF EXISTS "Staff can manage invoice_lines" ON invoice_lines;
  CREATE POLICY "staff can read invoice_lines" ON invoice_lines FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage invoice_lines" ON invoice_lines FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Payments ─────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payments') THEN
  DROP POLICY IF EXISTS "staff can read payments" ON payments;
  DROP POLICY IF EXISTS "staff can manage payments" ON payments;
  DROP POLICY IF EXISTS "Staff can read payments" ON payments;
  DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
  CREATE POLICY "staff can read payments" ON payments FOR SELECT USING (is_active_staff());
  CREATE POLICY "staff can manage payments" ON payments FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── Offers ───────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='offers') THEN
  DROP POLICY IF EXISTS "offers_select" ON offers;
  DROP POLICY IF EXISTS "offers_insert" ON offers;
  DROP POLICY IF EXISTS "offers_update" ON offers;
  DROP POLICY IF EXISTS "offers_delete" ON offers;
  CREATE POLICY "offers_select" ON offers FOR SELECT USING (is_active_staff());
  CREATE POLICY "offers_insert" ON offers FOR INSERT WITH CHECK (is_active_staff());
  CREATE POLICY "offers_update" ON offers FOR UPDATE USING (is_active_staff()) WITH CHECK (is_active_staff());
  CREATE POLICY "offers_delete" ON offers FOR DELETE USING (is_active_staff());
END IF;
END $$;

-- ── Offer lines ──────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='offer_lines') THEN
  DROP POLICY IF EXISTS "offer_lines_select" ON offer_lines;
  DROP POLICY IF EXISTS "offer_lines_insert" ON offer_lines;
  DROP POLICY IF EXISTS "offer_lines_update" ON offer_lines;
  DROP POLICY IF EXISTS "offer_lines_delete" ON offer_lines;
  CREATE POLICY "offer_lines_select" ON offer_lines FOR SELECT USING (is_active_staff());
  CREATE POLICY "offer_lines_insert" ON offer_lines FOR INSERT WITH CHECK (is_active_staff());
  CREATE POLICY "offer_lines_update" ON offer_lines FOR UPDATE USING (is_active_staff()) WITH CHECK (is_active_staff());
  CREATE POLICY "offer_lines_delete" ON offer_lines FOR DELETE USING (is_active_staff());
END IF;
END $$;

-- ── Parts ────────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parts') THEN
  DROP POLICY IF EXISTS "Staff can read parts" ON parts;
  DROP POLICY IF EXISTS "Staff can insert parts" ON parts;
  DROP POLICY IF EXISTS "Staff can update parts" ON parts;
  DROP POLICY IF EXISTS "Staff can delete parts" ON parts;
  CREATE POLICY "Staff can read parts" ON parts FOR SELECT USING (is_active_staff());
  CREATE POLICY "Staff can insert parts" ON parts FOR INSERT WITH CHECK (is_active_staff());
  CREATE POLICY "Staff can update parts" ON parts FOR UPDATE USING (is_active_staff()) WITH CHECK (is_active_staff());
  CREATE POLICY "Staff can delete parts" ON parts FOR DELETE USING (is_active_staff());
END IF;
END $$;

-- ── Signatures ───────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='signatures') THEN
  DROP POLICY IF EXISTS "Staff can view signatures" ON signatures;
  DROP POLICY IF EXISTS "Staff can insert signatures" ON signatures;
  CREATE POLICY "Staff can view signatures" ON signatures FOR SELECT USING (is_active_staff());
  CREATE POLICY "Staff can insert signatures" ON signatures FOR INSERT WITH CHECK (is_active_staff());
END IF;
END $$;

-- ── VAT returns ──────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vat_returns') THEN
  DROP POLICY IF EXISTS "Staff can read vat_returns" ON vat_returns;
  DROP POLICY IF EXISTS "Admin can manage vat_returns" ON vat_returns;
  CREATE POLICY "Staff can read vat_returns" ON vat_returns FOR SELECT USING (is_active_staff());
  CREATE POLICY "Admin can manage vat_returns" ON vat_returns FOR ALL USING (is_admin_staff()) WITH CHECK (is_admin_staff());
END IF;
END $$;

-- ── Purchases ────────────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchases') THEN
  DROP POLICY IF EXISTS "Staff can read purchases" ON purchases;
  DROP POLICY IF EXISTS "Office/admin can manage purchases" ON purchases;
  CREATE POLICY "Staff can read purchases" ON purchases FOR SELECT USING (is_active_staff());
  CREATE POLICY "Office/admin can manage purchases" ON purchases FOR ALL USING (is_office_or_admin_staff()) WITH CHECK (is_office_or_admin_staff());
END IF;
END $$;

-- ── Internal notes ───────────────────────────────────────
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='internal_notes') THEN
  DROP POLICY IF EXISTS "Staff can read all notes" ON internal_notes;
  DROP POLICY IF EXISTS "Staff can create notes" ON internal_notes;
  CREATE POLICY "Staff can read all notes" ON internal_notes FOR SELECT USING (is_active_staff());
  CREATE POLICY "Staff can create notes" ON internal_notes FOR INSERT WITH CHECK (is_active_staff());
END IF;
END $$;
