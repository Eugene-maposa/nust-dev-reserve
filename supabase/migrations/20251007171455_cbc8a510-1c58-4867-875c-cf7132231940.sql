-- Fix remaining function without search_path
CREATE OR REPLACE FUNCTION public.update_document_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    
    IF OLD.admin_comments IS DISTINCT FROM NEW.admin_comments THEN
        NEW.comment_updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;