-- 0007_secure_storage.sql
-- Force 'task-files' bucket to be private and enforce strict RLS

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('task_submissions', 'task_submissions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Disable any previous overly permissive policies on task_submissions if they exist
DROP POLICY IF EXISTS "task_submissions: allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "task_submissions: allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "task_submissions: allow users to delete own files" ON storage.objects;

-- Policy 1: Freelancers can upload to task-files
CREATE POLICY "task-files: allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-files');

-- Policy 2: Owner (freelancer) can read their own files
CREATE POLICY "task-files: owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'task-files' AND owner = auth.uid());

-- Policy 3: Admins can read all files
CREATE POLICY "task-files: admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'task-files' AND public.is_admin());

-- Policy 4: Business (client of the task) can read files
-- The path is: {freelancer_id}/{task_id}/{filename}
-- So (storage.foldername(name))[2] gives the task_id
CREATE POLICY "task-files: client read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-files' AND 
    auth.uid() IN (
      SELECT client_id FROM public.tasks 
      WHERE (storage.foldername(name))[2] = public.tasks.id::text
    )
  );
