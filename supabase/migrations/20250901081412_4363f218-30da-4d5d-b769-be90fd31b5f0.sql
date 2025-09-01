-- Add impact_level to projects table
ALTER TABLE projects ADD COLUMN impact_level text NOT NULL DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'very_high'));

-- Add document storage functionality
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Create document uploads tracking table
CREATE TABLE project_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_documents
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_documents
CREATE POLICY "Users can upload documents for their projects" 
ON project_documents 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own documents" 
ON project_documents 
FOR SELECT 
USING (
    auth.uid() = user_id OR 
    get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can view all documents" 
ON project_documents 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Storage policies for project documents
CREATE POLICY "Users can upload documents to their folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'project-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'project-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR get_current_user_role() = 'admin')
);

CREATE POLICY "Admins can view all project documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'project-documents' AND 
    get_current_user_role() = 'admin'
);

-- Create notifications table for tracking sent notifications
CREATE TABLE project_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    notification_type text NOT NULL CHECK (notification_type IN ('application_received', 'status_update', 'progress_alert')),
    channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    message text NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_notifications
ALTER TABLE project_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_notifications
CREATE POLICY "Users can view their own notifications" 
ON project_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" 
ON project_notifications 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Add triggers for updated_at columns
CREATE TRIGGER update_project_documents_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_notifications_updated_at
    BEFORE UPDATE ON project_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();