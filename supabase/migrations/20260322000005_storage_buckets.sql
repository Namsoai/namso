-- ── Storage Buckets & Policies ───────────────────────────────────────────────
-- Creates the bucket for task submission files and sets up the strict RLS rules

-- 1. Create the task_submissions bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_submissions', 'task_submissions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. (RLS is already enabled on storage.objects by default in Supabase)

-- 3. Policy: Allow authenticated users to upload files to task_submissions
CREATE POLICY "task_submissions: allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task_submissions');

-- 4. Policy: Allow authenticated users to read files from task_submissions
CREATE POLICY "task_submissions: allow authenticated reads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'task_submissions');

-- 5. Policy: Allow users to delete their own uploaded files
CREATE POLICY "task_submissions: allow users to delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'task_submissions' AND owner = auth.uid());
