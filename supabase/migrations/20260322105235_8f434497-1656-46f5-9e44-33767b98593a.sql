
-- 1. Remove SELECT policy on password_reset_tokens (token values should never be client-readable)
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.password_reset_tokens;

-- 2. Drop dangerous open blog policies (may still exist from migration 20250703062730)
DROP POLICY IF EXISTS "Anyone can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can delete blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Anyone can create author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone can update author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone can delete author profiles" ON public.blog_authors;
