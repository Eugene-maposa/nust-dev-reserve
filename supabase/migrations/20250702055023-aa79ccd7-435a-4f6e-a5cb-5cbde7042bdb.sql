
-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Recreate the admin policy using the security definer function
CREATE POLICY "Admins can view all profiles" ON public.user_profiles 
FOR ALL USING (public.get_current_user_role() = 'admin');

-- Also fix any other policies that might reference the user_profiles table recursively
-- Let's clean up and recreate all policies to be safe
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;

-- Create safe policies
CREATE POLICY "Allow public read access to user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can view their own profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles FOR ALL USING (public.get_current_user_role() = 'admin');
