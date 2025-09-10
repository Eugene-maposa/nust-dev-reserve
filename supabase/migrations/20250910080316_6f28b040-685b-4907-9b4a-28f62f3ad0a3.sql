-- Fix blog_authors RLS policies to allow admin operations
DROP POLICY IF EXISTS "Admins can create publisher authors" ON blog_authors;

-- Allow admins to manage all blog authors with proper permissions
CREATE POLICY "Admins can create any author profile" 
ON blog_authors 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure the blog_posts table allows proper admin access
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

CREATE POLICY "Anyone can view published blog posts" 
ON blog_posts 
FOR SELECT 
USING (published = true);

-- Allow admins to view all posts (published and unpublished)
CREATE POLICY "Admins can view all posts" 
ON blog_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);