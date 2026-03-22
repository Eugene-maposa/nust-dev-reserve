
-- 1. Fix password_reset_tokens: deny INSERT and DELETE for non-admin users
CREATE POLICY "Only server functions can insert reset tokens" ON public.password_reset_tokens
  FOR INSERT TO public WITH CHECK (false);

CREATE POLICY "Only server functions can delete reset tokens" ON public.password_reset_tokens
  FOR DELETE TO public USING (false);

-- 2. Fix user_profiles: replace permissive UPDATE policies with restricted ones
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Users can update their own profile but cannot change role or permissions
CREATE POLICY "Users can update own profile safely" ON public.user_profiles
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AND permissions = (SELECT permissions FROM public.user_profiles WHERE id = auth.uid()));

-- Admins can update any profile including role/permissions
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix blog tables: drop dangerous open policies
DROP POLICY IF EXISTS "Anyone can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can delete blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Anyone can create author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone can update author profiles" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone can delete author profiles" ON public.blog_authors;
