-- Add admin_comments column to project_documents table
ALTER TABLE public.project_documents 
ADD COLUMN admin_comments TEXT,
ADD COLUMN comment_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN commented_by UUID REFERENCES auth.users(id);

-- Update the updated_at trigger to also update comment_updated_at when admin_comments change
CREATE OR REPLACE FUNCTION public.update_document_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- If admin_comments changed, update comment_updated_at
    IF OLD.admin_comments IS DISTINCT FROM NEW.admin_comments THEN
        NEW.comment_updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document timestamps
CREATE TRIGGER update_project_documents_timestamps
    BEFORE UPDATE ON public.project_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_document_timestamps();

-- Update RLS policies to allow admins to comment
CREATE POLICY "Admins can comment on documents" 
ON public.project_documents 
FOR UPDATE 
USING (get_current_user_role() = 'admin');