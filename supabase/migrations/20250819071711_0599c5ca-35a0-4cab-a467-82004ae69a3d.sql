-- Add missing foreign key relationships for proper data joins

-- Add foreign key from projects.user_id to user_profiles.id
ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from bookings.user_id to user_profiles.id  
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from bookings.room_id to rooms.id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_room_id_fkey
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Add foreign key from project_stages.project_id to projects.id
ALTER TABLE public.project_stages
ADD CONSTRAINT project_stages_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add foreign key from blog_posts.author_id to blog_authors.id
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.blog_authors(id) ON DELETE CASCADE;

-- Add foreign key from blog_authors.user_id to user_profiles.id
ALTER TABLE public.blog_authors
ADD CONSTRAINT blog_authors_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from innovation_hub_applications.user_id to user_profiles.id
ALTER TABLE public.innovation_hub_applications
ADD CONSTRAINT innovation_hub_applications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign key from innovation_hub_applications.approved_by to user_profiles.id
ALTER TABLE public.innovation_hub_applications
ADD CONSTRAINT innovation_hub_applications_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;