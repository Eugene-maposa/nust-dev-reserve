
-- Remove the custom role and permissions columns from user_profiles
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS permissions;

-- Drop the security definer function that checks user roles
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Remove all role-based RLS policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Only admins can modify rooms" ON public.rooms;
DROP POLICY IF EXISTS "Only admins can modify blog authors" ON public.blog_authors;

-- Simplify RLS policies to use basic authentication
CREATE POLICY "Authenticated users can view profiles" ON public.user_profiles 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view bookings" ON public.bookings 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage rooms" ON public.rooms 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage blog authors" ON public.blog_authors 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Update the handle_new_user function to remove role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$;
