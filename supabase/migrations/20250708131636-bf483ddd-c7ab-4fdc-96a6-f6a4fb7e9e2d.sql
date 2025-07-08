
-- Add foreign key constraint to link blog_posts to blog_authors
ALTER TABLE public.blog_posts 
ADD CONSTRAINT fk_blog_posts_author 
FOREIGN KEY (author_id) REFERENCES public.blog_authors(id) ON DELETE SET NULL;

-- Create an index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
