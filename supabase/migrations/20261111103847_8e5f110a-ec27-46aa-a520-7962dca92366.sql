ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
UPDATE public.user_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;
ALTER TABLE public.user_profiles ALTER COLUMN approval_status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Users can update own profile safely" ON public.user_profiles;
CREATE POLICY "Users can update own profile safely" ON public.user_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.user_profiles p WHERE p.id = auth.uid())
  AND permissions IS NOT DISTINCT FROM (SELECT p.permissions FROM public.user_profiles p WHERE p.id = auth.uid())
  AND approval_status = (SELECT p.approval_status FROM public.user_profiles p WHERE p.id = auth.uid())
);