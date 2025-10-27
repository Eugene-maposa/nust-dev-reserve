-- Update RLS policies for blog tables to work with user_roles system

-- Drop existing admin policies for blog_posts
DROP POLICY IF EXISTS "Authors can modify their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;

-- Create admin policies using has_role function
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can view all blog posts"
ON public.blog_posts
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin') OR
    ( SELECT blog_authors.user_id
   FROM blog_authors
  WHERE (blog_authors.id = blog_posts.author_id)) = auth.uid()
);

-- Drop existing admin policies for blog_authors
DROP POLICY IF EXISTS "Only admins can modify blog authors" ON public.blog_authors;

-- Create admin policies using has_role function
CREATE POLICY "Admins can manage all blog authors"
ON public.blog_authors
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update rooms policy
DROP POLICY IF EXISTS "Only admins can modify rooms" ON public.rooms;

CREATE POLICY "Admins can manage all rooms"
ON public.rooms
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update bookings policy
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

CREATE POLICY "Admins can manage all bookings"
ON public.bookings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));