-- ═══════════════════════════════════════════════════════════════════════════
-- YatraAI — Supabase Storage Setup
-- Run AFTER 001 and 002 migrations
-- ═══════════════════════════════════════════════════════════════════════════

-- Create 'receipts' storage bucket (private, authenticated access only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,  -- 5 MB limit per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder: receipts/<user_id>/*
create policy "receipts_insert_auth"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own receipts
create policy "receipts_select_auth"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own receipts
create policy "receipts_delete_auth"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable realtime on all key tables
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.trip_members;
alter publication supabase_realtime add table public.settlements;
