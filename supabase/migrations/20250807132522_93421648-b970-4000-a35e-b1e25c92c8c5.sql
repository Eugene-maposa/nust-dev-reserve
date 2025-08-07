-- Create projects table for TRL tracking
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'technology',
    current_trl_level INTEGER NOT NULL DEFAULT 1 CHECK (current_trl_level >= 1 AND current_trl_level <= 9),
    completed_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies
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
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create project stages table for detailed tracking
CREATE TABLE public.project_stages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    trl_level INTEGER NOT NULL CHECK (trl_level >= 1 AND trl_level <= 9),
    stage_name TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    evidence_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, trl_level)
);

-- Enable RLS for project_stages
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for project_stages
CREATE POLICY "Users can manage stages for their projects" 
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
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_stages_updated_at
BEFORE UPDATE ON public.project_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_stages_project_id ON public.project_stages(project_id);
CREATE INDEX idx_project_stages_trl_level ON public.project_stages(trl_level);