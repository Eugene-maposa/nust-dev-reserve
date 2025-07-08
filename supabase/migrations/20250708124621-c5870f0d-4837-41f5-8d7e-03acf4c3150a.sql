
-- Add foreign key constraint between bookings.room_id and rooms.id
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_room 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;
