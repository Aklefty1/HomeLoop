-- ============================================================
-- HomeLoop Storage Bucket for Documents
-- Run this AFTER 001_initial_schema.sql in your Supabase SQL editor.
-- Creates a storage bucket so users can upload warranties, receipts, etc.
-- ============================================================

-- Create the storage bucket for home documents
insert into storage.buckets (id, name, public)
values ('home-documents', 'home-documents', false);

-- Policy: Users can upload files to their own home folders
-- File path format: {user_id}/{home_id}/{filename}
create policy "Users can upload documents to their homes"
  on storage.objects for insert
  with check (
    bucket_id = 'home-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own files
create policy "Users can view their own documents"
  on storage.objects for select
  using (
    bucket_id = 'home-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own files
create policy "Users can delete their own documents"
  on storage.objects for delete
  using (
    bucket_id = 'home-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
