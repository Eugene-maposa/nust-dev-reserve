-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'lecturer', 'student', 'staff', 'security');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'pending',
    trl_level INTEGER,
    start_date DATE,
    expected_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all projects"
ON public.projects
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create project_stages table
CREATE TABLE public.project_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    stage_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on project_stages
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_stages
CREATE POLICY "Users can view stages of their projects"
ON public.project_stages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_stages.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage stages of their projects"
ON public.project_stages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_stages.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all project stages"
ON public.project_stages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all project stages"
ON public.project_stages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create project_documents table
CREATE TABLE public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_documents
CREATE POLICY "Users can view documents of their projects"
ON public.project_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_documents.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage documents of their projects"
ON public.project_documents
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_documents.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all documents"
ON public.project_documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all documents"
ON public.project_documents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_stages_updated_at
BEFORE UPDATE ON public.project_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make checkchirasha@gmail.com an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'checkchirasha@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;