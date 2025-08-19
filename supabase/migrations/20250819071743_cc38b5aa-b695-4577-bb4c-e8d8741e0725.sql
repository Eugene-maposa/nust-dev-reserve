-- Add missing foreign key relationships one by one with unique names

-- Add foreign key from projects.user_id to user_profiles.id
ALTER TABLE public.projects 
ADD CONSTRAINT fk_projects_user_profiles
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from bookings.user_id to user_profiles.id  
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_user_profiles
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from bookings.room_id to rooms.id
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_rooms
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Add foreign key from project_stages.project_id to projects.id
ALTER TABLE public.project_stages
ADD CONSTRAINT fk_project_stages_projects
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;