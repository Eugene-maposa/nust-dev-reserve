
-- Create user_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  student_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'available'
);

-- Create bookings table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_authors table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.blog_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  author_id UUID,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password_reset_tokens table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Create simple RLS policies for user_profiles (no recursive queries)
CREATE POLICY "Allow public read access to user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Drop and recreate RLS policies for rooms
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Only admins can modify rooms" ON public.rooms;
DROP POLICY IF EXISTS "Everyone can view rooms" ON public.rooms;

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);

-- Drop and recreate RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- Drop and recreate RLS policies for blog_authors
DROP POLICY IF EXISTS "Anyone can view blog authors" ON public.blog_authors;
DROP POLICY IF EXISTS "Users can create their own author profile" ON public.blog_authors;
DROP POLICY IF EXISTS "Authors can update their own profile" ON public.blog_authors;
DROP POLICY IF EXISTS "Authors can delete their own profile" ON public.blog_authors;
DROP POLICY IF EXISTS "Only admins can modify blog authors" ON public.blog_authors;
DROP POLICY IF EXISTS "Anyone can read author profiles" ON public.blog_authors;

CREATE POLICY "Anyone can view blog authors" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "Users can create their own author profile" ON public.blog_authors FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authors can update their own profile" ON public.blog_authors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Authors can delete their own profile" ON public.blog_authors FOR DELETE USING (user_id = auth.uid());

-- Drop and recreate RLS policies for blog_posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can modify their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Authors can view their own posts" ON public.blog_posts FOR SELECT USING ((SELECT user_id FROM blog_authors WHERE id = author_id) = auth.uid());

-- Drop and recreate RLS policies for password_reset_tokens
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.password_reset_tokens;

CREATE POLICY "Users can view their own reset tokens" ON public.password_reset_tokens FOR SELECT USING (auth.uid() = user_id);

-- Create database functions (using CREATE OR REPLACE to handle existing functions)
CREATE OR REPLACE FUNCTION public.check_password_requirements(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN length(password) >= 8
        AND password ~ '[A-Z]'
        AND password ~ '[a-z]'
        AND password ~ '[0-9]'
        AND password ~ '[!@#$%^&*(),.?":{}|<>]';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_password(user_email text, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_password_with_validation(user_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT check_password_requirements(new_password) THEN
        RAISE EXCEPTION 'Password does not meet requirements';
        RETURN false;
    END IF;
    
    PERFORM update_user_password(user_email, new_password);
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    -- Simple permission check without role-based complexity
    v_has_permission := p_permission IN ('can_book', 'can_view_bookings', 'can_view_own_bookings');
    
    RETURN v_has_permission;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_password_reset_token(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    v_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (v_user_id, v_token, NOW() + INTERVAL '1 hour');
    
    RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_reset_token(p_token text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id
    FROM password_reset_tokens
    WHERE token = p_token
    AND expires_at > NOW()
    AND used = FALSE;
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = v_user_id;
    
    UPDATE password_reset_tokens
    SET used = TRUE
    WHERE token = p_token;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_admin_password(admin_email text DEFAULT 'admin@nust.ac.zw'::text, new_password text DEFAULT 'Admin@123'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = admin_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS update_blog_authors_updated_at ON public.blog_authors;
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS update_password_reset_tokens_updated_at ON public.password_reset_tokens;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_authors_updated_at
    BEFORE UPDATE ON public.blog_authors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_password_reset_tokens_updated_at
    BEFORE UPDATE ON public.password_reset_tokens
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
