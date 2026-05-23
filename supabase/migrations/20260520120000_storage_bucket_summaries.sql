-- ============================================================
-- StudyLab — Storage Bucket: summaries
-- ============================================================

-- Create private bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'summaries',
  'summaries',
  false,
  20971520,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Path structure: {user_id}/{summary_id}.pdf
-- Policy checks: first folder segment must equal the authenticated user's ID

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'summaries'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'summaries'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'summaries'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
