-- Add missing columns to existing tables

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS code TEXT;

-- Add missing columns to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS floor INTEGER;

-- Add missing columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS supervisor TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_cost DECIMAL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS award_category TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS patent_application_url TEXT;

-- Add missing columns to project_documents
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS admin_comments TEXT;

-- Create foreign key relationship between bookings and rooms
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_room_id_fkey,
  ADD CONSTRAINT bookings_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Create innovation_hub_applications table
CREATE TABLE IF NOT EXISTS public.innovation_hub_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    student_number TEXT,
    organisation TEXT,
    position TEXT,
    faculty TEXT,
    department TEXT,
    project_description TEXT,
    innovation_type TEXT,
    target_market TEXT,
    team_members TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on innovation_hub_applications
ALTER TABLE public.innovation_hub_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for innovation_hub_applications
CREATE POLICY "Users can view their own applications"
ON public.innovation_hub_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.innovation_hub_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON public.innovation_hub_applications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.innovation_hub_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all applications"
ON public.innovation_hub_applications
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on innovation_hub_applications
DROP TRIGGER IF EXISTS update_innovation_hub_applications_updated_at ON public.innovation_hub_applications;
CREATE TRIGGER update_innovation_hub_applications_updated_at
BEFORE UPDATE ON public.innovation_hub_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();