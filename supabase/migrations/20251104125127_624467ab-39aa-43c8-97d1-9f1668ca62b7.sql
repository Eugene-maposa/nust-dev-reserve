-- Remove duplicate foreign key constraint
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS fk_blog_posts_author;