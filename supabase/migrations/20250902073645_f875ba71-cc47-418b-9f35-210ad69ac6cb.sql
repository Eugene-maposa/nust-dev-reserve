-- Add auto-generated code sequence for user tracking
CREATE SEQUENCE IF NOT EXISTS user_code_seq START 1000;

-- Add code column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Create function to generate user codes
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
BEGIN
    new_code := 'USR' || LPAD(nextval('user_code_seq')::TEXT, 6, '0');
    RETURN new_code;
END;
$$;

-- Create trigger to auto-generate codes for existing and new users
CREATE OR REPLACE FUNCTION auto_generate_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.code IS NULL THEN
        NEW.code := generate_user_code();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for user code generation
DROP TRIGGER IF EXISTS trigger_auto_generate_user_code ON public.user_profiles;
CREATE TRIGGER trigger_auto_generate_user_code
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_user_code();

-- Update existing users without codes
UPDATE public.user_profiles 
SET code = generate_user_code() 
WHERE code IS NULL;

-- Add supervisor column to projects table for better tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS supervisor TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS budget_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS award_category TEXT,
ADD COLUMN IF NOT EXISTS idf_document_url TEXT,
ADD COLUMN IF NOT EXISTS mou_moa_document_url TEXT,
ADD COLUMN IF NOT EXISTS patent_application_url TEXT;