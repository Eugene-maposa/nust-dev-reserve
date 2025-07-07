
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Keep only the simple, non-recursive policies
-- "Allow public read access to user_profiles" - already exists and works
-- "Users can update own profile" - already exists and works

-- Also drop the problematic get_current_user_role function since it causes recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Clean up any other policies that might reference the dropped function
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;

-- Recreate simple policies without recursion
CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);
