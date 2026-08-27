-- Create storage bucket for lead photos
insert into storage.buckets (id, name, public)
values ('lead-photos', 'lead-photos', true)
on conflict (id) do nothing;

-- Allow authenticated staff to upload lead photos
create policy "Staff can upload lead photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lead-photos');

-- Allow authenticated staff to delete lead photos
create policy "Staff can delete lead photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lead-photos');

-- Allow anyone to read lead photos (public bucket)
create policy "Anyone can read lead photos"
  on storage.objects for select
  to public
  using (bucket_id = 'lead-photos');

-- Allow service role (used by public form) to upload
-- The service role bypasses RLS, so no explicit policy needed.
