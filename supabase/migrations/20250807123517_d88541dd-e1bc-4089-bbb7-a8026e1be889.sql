-- Fix infinite recursion in user_profiles RLS policies
-- Drop the problematic policy that references itself
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a simpler admin policy that doesn't cause recursion
CREATE POLICY "Admins can modify all profiles" 
ON public.user_profiles 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Also ensure we have the proper foreign key for bookings to rooms
ALTER TABLE public.bookings 
ADD CONSTRAINT IF NOT EXISTS fk_bookings_room 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);