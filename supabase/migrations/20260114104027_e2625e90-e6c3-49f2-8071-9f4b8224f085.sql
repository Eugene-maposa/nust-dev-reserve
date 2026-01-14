-- Fix PUBLIC_DATA_EXPOSURE: Remove dangerous public access policy on user_profiles
-- This policy allows unauthenticated access to sensitive PII (emails, phone numbers, student numbers)

DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON public.user_profiles;

-- Create proper admin policy for viewing all profiles (users already have "Users can view their own profile")
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));