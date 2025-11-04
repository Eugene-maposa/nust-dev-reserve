-- Fix foreign key constraint on blog_posts table
-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Add the correct foreign key constraint pointing to blog_authors
ALTER TABLE blog_posts 
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES blog_authors(id) 
ON DELETE SET NULL;