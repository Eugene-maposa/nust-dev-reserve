-- ============================================
-- CRITICAL SECURITY FIX: Separate User Roles Table
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'lecturer', 'student', 'staff', 'security');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get user role (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'lecturer' THEN 2
      WHEN 'staff' THEN 3
      WHEN 'security' THEN 4
      WHEN 'student' THEN 5
    END
  LIMIT 1;
$$;

-- Migrate existing roles from user_profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.user_profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update get_current_user_role function to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role(auth.uid());
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- Fix Function Search Paths (Security)
-- ============================================

CREATE OR REPLACE FUNCTION public.check_password_requirements(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN length(password) >= 8
        AND password ~ '[A-Z]'
        AND password ~ '[a-z]'
        AND password ~ '[0-9]'
        AND password ~ '[!@#$%^&*(),.?":{}|<>]';
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_project_code(project_year INTEGER, user_department TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    dept_abbrev TEXT;
    sequence_num INTEGER;
    new_code TEXT;
BEGIN
    dept_abbrev := CASE UPPER(user_department)
        WHEN 'ENGINEERING' THEN 'ENG'
        WHEN 'COMPUTER SCIENCE' THEN 'CS'
        WHEN 'INFORMATION TECHNOLOGY' THEN 'IT'
        WHEN 'BUSINESS' THEN 'BUS'
        WHEN 'SCIENCE' THEN 'SCI'
        WHEN 'AGRICULTURE' THEN 'AGR'
        WHEN 'MEDICINE' THEN 'MED'
        WHEN 'LAW' THEN 'LAW'
        WHEN 'EDUCATION' THEN 'EDU'
        WHEN 'ARTS' THEN 'ART'
        ELSE 'GEN'
    END;
    
    SELECT COALESCE(MAX(CAST(SPLIT_PART(SPLIT_PART(code, '-', 3), '-', 1) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM user_profiles 
    WHERE code LIKE project_year || '-' || dept_abbrev || '-%';
    
    new_code := project_year || '-' || dept_abbrev || '-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_year INTEGER;
    user_dept TEXT;
BEGIN
    IF NEW.code IS NULL THEN
        project_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()));
        
        SELECT COALESCE(p.department, 'GENERAL') INTO user_dept
        FROM projects p 
        WHERE p.user_id = NEW.id 
        ORDER BY p.created_at DESC 
        LIMIT 1;
        
        IF user_dept IS NULL THEN
            user_dept := 'GENERAL';
        END IF;
        
        NEW.code := generate_project_code(project_year, user_dept);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_code_on_project_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_year INTEGER;
    new_code TEXT;
BEGIN
    project_year := EXTRACT(YEAR FROM NEW.start_date);
    new_code := generate_project_code(project_year, COALESCE(NEW.department, 'GENERAL'));
    
    UPDATE user_profiles 
    SET code = new_code 
    WHERE id = NEW.user_id 
    AND (code IS NULL OR NOT code LIKE project_year || '-%');
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_password_with_validation(user_email TEXT, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_user_role(p_user_id UUID, p_new_role VARCHAR, p_permissions JSONB DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_new_role NOT IN ('admin', 'lecturer', 'student', 'staff', 'security') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;
    
    -- Insert or update role in user_roles table
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_new_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update permissions in user_profiles
    UPDATE user_profiles
    SET permissions = COALESCE(p_permissions, permissions)
    WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_password(user_email TEXT, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_reset_token(p_token TEXT, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_has_permission BOOLEAN;
BEGIN
    SELECT get_user_role(p_user_id) INTO v_role;
    
    CASE v_role
        WHEN 'admin' THEN
            v_has_permission := TRUE;
        WHEN 'lecturer' THEN
            v_has_permission := p_permission IN ('can_book', 'can_view_bookings');
        WHEN 'student' THEN
            v_has_permission := p_permission IN ('can_book', 'can_view_own_bookings');
        WHEN 'staff' THEN
            v_has_permission := p_permission IN ('can_book', 'can_view_bookings', 'can_manage_resources');
        WHEN 'security' THEN
            v_has_permission := p_permission IN ('can_view_bookings', 'can_verify_bookings');
        ELSE
            v_has_permission := FALSE;
    END CASE;
    
    RETURN v_has_permission;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_password_reset_token(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.reset_admin_password(admin_email TEXT DEFAULT 'admin@nust.ac.zw', new_password TEXT DEFAULT 'Admin@123')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = admin_email;
END;
$$;

-- Update handle_new_user to use new roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Insert role into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role);
    
    RETURN NEW;
END;
$$;

-- ============================================
-- Add Missing Foreign Key Constraints
-- ============================================

-- Add foreign keys for blog_posts
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey,
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.blog_authors(id) ON DELETE SET NULL;

-- Add foreign keys for bookings
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_room_id_fkey,
ADD CONSTRAINT bookings_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign keys for projects
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey,
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign keys for project_documents
ALTER TABLE public.project_documents
DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey,
ADD CONSTRAINT project_documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_documents
DROP CONSTRAINT IF EXISTS project_documents_user_id_fkey,
ADD CONSTRAINT project_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Add foreign keys for project_stages
ALTER TABLE public.project_stages
DROP CONSTRAINT IF EXISTS project_stages_project_id_fkey,
ADD CONSTRAINT project_stages_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add foreign keys for project_notifications
ALTER TABLE public.project_notifications
DROP CONSTRAINT IF EXISTS project_notifications_project_id_fkey,
ADD CONSTRAINT project_notifications_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_notifications
DROP CONSTRAINT IF EXISTS project_notifications_user_id_fkey,
ADD CONSTRAINT project_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ============================================
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON public.bookings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);