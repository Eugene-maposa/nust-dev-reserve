-- Add foreign key relationship between blog_posts and blog_authors
ALTER TABLE blog_posts 
ADD CONSTRAINT fk_blog_posts_author_id 
FOREIGN KEY (author_id) REFERENCES blog_authors(id) ON DELETE SET NULL;

-- Update RLS policies to allow admins to create blog posts
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can modify their own posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can view their own posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can update their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can delete their own blog posts" ON blog_posts;

-- Create new policies that work with the admin system
CREATE POLICY "Admins can manage all blog posts" 
ON blog_posts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authors can manage their own blog posts" 
ON blog_posts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM blog_authors 
    WHERE id = blog_posts.author_id AND user_id = auth.uid()
  )
);

-- Ensure blog_authors can be created by admins or users for their own profiles
DROP POLICY IF EXISTS "Only admins can modify blog authors" ON blog_authors;
DROP POLICY IF EXISTS "Users can create their own author profile" ON blog_authors;
DROP POLICY IF EXISTS "Authors can update their own profile" ON blog_authors;
DROP POLICY IF EXISTS "Authors can delete their own profile" ON blog_authors;

CREATE POLICY "Admins can manage all blog authors" 
ON blog_authors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can manage their own author profile" 
ON blog_authors 
FOR ALL 
USING (user_id = auth.uid());

-- Allow admins to create author profiles without user_id (for publisher names)
CREATE POLICY "Admins can create publisher authors" 
ON blog_authors 
FOR INSERT 
WITH CHECK (
  user_id IS NULL AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);