-- 0020: Fix circular RLS dependency on staff table
-- The staff RLS policy references staff in its own subquery, which Postgres
-- resolves by returning empty (RLS applied recursively), blocking all reads.
-- Fix: SECURITY DEFINER functions that bypass RLS to check staff membership.

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

create policy "staff can read staff"
  on staff for select using (is_active_staff());

create policy "admin can manage staff"
  on staff for all
  using (is_admin_staff())
  with check (is_admin_staff());

-- ── Settings ─────────────────────────────────────────────
drop policy if exists "staff can read settings" on settings;
drop policy if exists "admin can manage settings" on settings;

create policy "staff can read settings"
  on settings for select using (is_active_staff());

create policy "admin can manage settings"
  on settings for all
  using (is_admin_staff())
  with check (is_admin_staff());

-- ── Customers ────────────────────────────────────────────
drop policy if exists "staff can read customers" on customers;
drop policy if exists "staff can manage customers" on customers;

create policy "staff can read customers"
  on customers for select using (is_active_staff());

create policy "staff can manage customers"
  on customers for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Vehicles ─────────────────────────────────────────────
drop policy if exists "staff can read vehicles" on vehicles;
drop policy if exists "staff can manage vehicles" on vehicles;

create policy "staff can read vehicles"
  on vehicles for select using (is_active_staff());

create policy "staff can manage vehicles"
  on vehicles for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Leads ────────────────────────────────────────────────
drop policy if exists "staff can read leads" on leads;
drop policy if exists "staff can manage leads" on leads;

create policy "staff can read leads"
  on leads for select using (is_active_staff());

create policy "staff can manage leads"
  on leads for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Lead photos ──────────────────────────────────────────
drop policy if exists "staff can read lead_photos" on lead_photos;
drop policy if exists "staff can manage lead_photos" on lead_photos;

create policy "staff can read lead_photos"
  on lead_photos for select using (is_active_staff());

create policy "staff can manage lead_photos"
  on lead_photos for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Jobs ─────────────────────────────────────────────────
drop policy if exists "staff can read jobs" on jobs;
drop policy if exists "staff can manage jobs" on jobs;

create policy "staff can read jobs"
  on jobs for select using (is_active_staff());

create policy "staff can manage jobs"
  on jobs for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Job events ───────────────────────────────────────────
drop policy if exists "staff can read job_events" on job_events;
drop policy if exists "staff can insert job_events" on job_events;

create policy "staff can read job_events"
  on job_events for select using (is_active_staff());

create policy "staff can insert job_events"
  on job_events for insert
  with check (is_active_staff());

-- ── Job photos ───────────────────────────────────────────
drop policy if exists "staff can read job_photos" on job_photos;
drop policy if exists "staff can insert job_photos" on job_photos;

create policy "staff can read job_photos"
  on job_photos for select using (is_active_staff());

create policy "staff can insert job_photos"
  on job_photos for insert
  with check (is_active_staff());

-- ── Notifications ────────────────────────────────────────
drop policy if exists "staff can read notifications" on notifications;
drop policy if exists "staff can manage notifications" on notifications;

create policy "staff can read notifications"
  on notifications for select using (is_active_staff());

create policy "staff can manage notifications"
  on notifications for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Documents / number ranges ────────────────────────────
drop policy if exists "staff can read number_ranges" on number_ranges;
drop policy if exists "office/admin can manage number_ranges" on number_ranges;

create policy "staff can read number_ranges"
  on number_ranges for select using (is_active_staff());

create policy "office/admin can manage number_ranges"
  on number_ranges for all
  using (is_office_or_admin_staff())
  with check (is_office_or_admin_staff());

drop policy if exists "staff can read documents" on documents;
drop policy if exists "staff can manage documents" on documents;

create policy "staff can read documents"
  on documents for select using (is_active_staff());

create policy "staff can manage documents"
  on documents for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Resources / Opening hours / Blackouts ────────────────
drop policy if exists "staff can read resources" on resources;
drop policy if exists "staff can manage resources" on resources;

create policy "staff can read resources"
  on resources for select using (is_active_staff());

create policy "staff can manage resources"
  on resources for all
  using (is_active_staff())
  with check (is_active_staff());

drop policy if exists "staff can read opening_hours" on opening_hours;
drop policy if exists "staff can manage opening_hours" on opening_hours;

create policy "staff can read opening_hours"
  on opening_hours for select using (is_active_staff());

create policy "staff can manage opening_hours"
  on opening_hours for all
  using (is_active_staff())
  with check (is_active_staff());

drop policy if exists "staff can read blackouts" on blackouts;
drop policy if exists "staff can manage blackouts" on blackouts;

create policy "staff can read blackouts"
  on blackouts for select using (is_active_staff());

create policy "staff can manage blackouts"
  on blackouts for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Appointments ─────────────────────────────────────────
drop policy if exists "staff can read appointments" on appointments;
drop policy if exists "staff can manage appointments" on appointments;

create policy "staff can read appointments"
  on appointments for select using (is_active_staff());

create policy "staff can manage appointments"
  on appointments for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Tasks / Time entries ─────────────────────────────────
drop policy if exists "staff can read job_tasks" on job_tasks;
drop policy if exists "staff can manage job_tasks" on job_tasks;

create policy "staff can read job_tasks"
  on job_tasks for select using (is_active_staff());

create policy "staff can manage job_tasks"
  on job_tasks for all
  using (is_active_staff())
  with check (is_active_staff());

drop policy if exists "staff can read time_entries" on time_entries;
drop policy if exists "staff can manage time_entries" on time_entries;

create policy "staff can read time_entries"
  on time_entries for select using (is_active_staff());

create policy "staff can manage time_entries"
  on time_entries for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Invoices / Invoice lines / Payments ──────────────────
drop policy if exists "staff can read invoices" on invoices;
drop policy if exists "staff can manage invoices" on invoices;

create policy "staff can read invoices"
  on invoices for select using (is_active_staff());

create policy "staff can manage invoices"
  on invoices for all
  using (is_active_staff())
  with check (is_active_staff());

drop policy if exists "staff can read invoice_lines" on invoice_lines;
drop policy if exists "staff can manage invoice_lines" on invoice_lines;

create policy "staff can read invoice_lines"
  on invoice_lines for select using (is_active_staff());

create policy "staff can manage invoice_lines"
  on invoice_lines for all
  using (is_active_staff())
  with check (is_active_staff());

drop policy if exists "staff can read payments" on payments;
drop policy if exists "staff can manage payments" on payments;

create policy "staff can read payments"
  on payments for select using (is_active_staff());

create policy "staff can manage payments"
  on payments for all
  using (is_active_staff())
  with check (is_active_staff());

-- ── Offers / Offer lines ─────────────────────────────────
drop policy if exists "offers_select" on offers;
drop policy if exists "offers_insert" on offers;
drop policy if exists "offers_update" on offers;
drop policy if exists "offers_delete" on offers;

create policy "offers_select"
  on offers for select using (is_active_staff());

create policy "offers_insert"
  on offers for insert
  with check (is_active_staff());

create policy "offers_update"
  on offers for update
  using (is_active_staff())
  with check (is_active_staff());

create policy "offers_delete"
  on offers for delete
  using (is_active_staff());

drop policy if exists "offer_lines_select" on offer_lines;
drop policy if exists "offer_lines_insert" on offer_lines;
drop policy if exists "offer_lines_update" on offer_lines;
drop policy if exists "offer_lines_delete" on offer_lines;

create policy "offer_lines_select"
  on offer_lines for select using (is_active_staff());

create policy "offer_lines_insert"
  on offer_lines for insert
  with check (is_active_staff());

create policy "offer_lines_update"
  on offer_lines for update
  using (is_active_staff())
  with check (is_active_staff());

create policy "offer_lines_delete"
  on offer_lines for delete
  using (is_active_staff());

-- ── Parts ────────────────────────────────────────────────
drop policy if exists "Staff can read parts" on parts;
drop policy if exists "Staff can insert parts" on parts;
drop policy if exists "Staff can update parts" on parts;
drop policy if exists "Staff can delete parts" on parts;

create policy "Staff can read parts"
  on parts for select using (is_active_staff());

create policy "Staff can insert parts"
  on parts for insert
  with check (is_active_staff());

create policy "Staff can update parts"
  on parts for update
  using (is_active_staff())
  with check (is_active_staff());

create policy "Staff can delete parts"
  on parts for delete
  using (is_active_staff());

-- ── Signatures ───────────────────────────────────────────
drop policy if exists "Staff can view signatures" on signatures;
drop policy if exists "Staff can insert signatures" on signatures;

create policy "Staff can view signatures"
  on signatures for select using (is_active_staff());

create policy "Staff can insert signatures"
  on signatures for insert
  with check (is_active_staff());

-- ── VAT returns ──────────────────────────────────────────
drop policy if exists "Staff can read vat_returns" on vat_returns;
drop policy if exists "Admin can manage vat_returns" on vat_returns;

create policy "Staff can read vat_returns"
  on vat_returns for select using (is_active_staff());

create policy "Admin can manage vat_returns"
  on vat_returns for all
  using (is_admin_staff())
  with check (is_admin_staff());

-- ── Purchases ────────────────────────────────────────────
drop policy if exists "Staff can read purchases" on purchases;
drop policy if exists "Office/admin can manage purchases" on purchases;

create policy "Staff can read purchases"
  on purchases for select using (is_active_staff());

create policy "Office/admin can manage purchases"
  on purchases for all
  using (is_office_or_admin_staff())
  with check (is_office_or_admin_staff());

-- ── Internal notes ───────────────────────────────────────
drop policy if exists "Staff can read all notes" on internal_notes;
drop policy if exists "Staff can create notes" on internal_notes;

create policy "Staff can read all notes"
  on internal_notes for select using (is_active_staff());

create policy "Staff can create notes"
  on internal_notes for insert
  with check (is_active_staff());
