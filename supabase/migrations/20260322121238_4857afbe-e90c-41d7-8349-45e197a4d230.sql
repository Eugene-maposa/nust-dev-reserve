
-- Add National ID image columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS id_front_url text,
  ADD COLUMN IF NOT EXISTS id_back_url text;

-- Create storage bucket for ID document images
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own ID documents
CREATE POLICY "Users can upload own ID documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can view their own ID documents
CREATE POLICY "Users can view own ID documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Admins can view all ID documents
CREATE POLICY "Admins can view all ID documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'id-documents' AND public.has_role(auth.uid(), 'admin'));

-- RLS: Users can update their own ID documents
CREATE POLICY "Users can update own ID documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can delete their own ID documents  
CREATE POLICY "Users can delete own ID documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
