-- Remove the older foreign key constraint to resolve the conflict
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS fk_bookings_room;

-- Keep only the correctly named one: fk_bookings_rooms