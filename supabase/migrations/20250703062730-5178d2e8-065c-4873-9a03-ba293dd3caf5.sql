
-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update any blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete any blog posts" ON public.blog_posts;

-- Create completely open policies for blog_posts (no authentication required)
CREATE POLICY "Anyone can create blog posts" ON public.blog_posts 
FOR INSERT USING (true);

CREATE POLICY "Anyone can update blog posts" ON public.blog_posts 
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete blog posts" ON public.blog_posts 
FOR DELETE USING (true);

-- Drop existing policies for blog_authors that require authentication
DROP POLICY IF EXISTS "Authenticated users can create author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Authenticated users can update author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Authenticated users can delete author profiles" ON public.blog_authors;

-- Create completely open policies for blog_authors (no authentication required)
CREATE POLICY "Anyone can create author profiles" ON public.blog_authors 
FOR INSERT USING (true);

CREATE POLICY "Anyone can update author profiles" ON public.blog_authors 
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete author profiles" ON public.blog_authors 
FOR DELETE USING (true);
