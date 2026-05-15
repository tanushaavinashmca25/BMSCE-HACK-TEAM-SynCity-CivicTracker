-- Add image_path column to reports so backend can re-fetch evidence from Storage.
alter table public.reports
  add column if not exists image_path text;

-- Create the public Storage bucket for report evidence photos.
-- Idempotent: skip if already created via the Studio.
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

-- RLS: authenticated users may upload only into a folder matching their own uid.
-- Path convention enforced by the client: <auth.uid()>/<timestamp>.<ext>
drop policy if exists "Users can upload own report photos"
  on storage.objects;
create policy "Users can upload own report photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is marked public above; this is belt-and-suspenders for
-- the case where someone flips it private but still wants anon reads).
drop policy if exists "Anyone can read report photos"
  on storage.objects;
create policy "Anyone can read report photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'report-photos');

-- Owners may delete their own photos (e.g. retake before submit).
drop policy if exists "Users can delete own report photos"
  on storage.objects;
create policy "Users can delete own report photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
