-- Fix infinite recursion in user_profiles RLS policies
-- Drop the problematic policy that references itself
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Create a simpler admin policy that doesn't cause recursion
CREATE POLICY "Admins can modify all profiles" 
ON public.user_profiles 
FOR ALL
USING (public.get_current_user_role() = 'admin');

-- Fix the bookings table foreign key (without IF NOT EXISTS which isn't supported in ALTER TABLE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_room'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT fk_bookings_room 
        FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);