# Supabase Storage Setup for Documents

## Create the Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "New Bucket"
3. Settings:
   - Name: `documents`
   - Public: NO (private bucket)
   - File size limit: 10MB
   - Allowed MIME types: 
     - application/pdf
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - text/plain
     - text/markdown
     - text/csv

## Storage Policies

Run these in the SQL Editor:

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
