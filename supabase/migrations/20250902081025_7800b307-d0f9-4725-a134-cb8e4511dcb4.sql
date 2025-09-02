-- Update the code generation function to use year-department-number format
DROP FUNCTION IF EXISTS public.generate_user_code();

CREATE OR REPLACE FUNCTION public.generate_project_code(
    project_year INTEGER,
    user_department TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    dept_abbrev TEXT;
    sequence_num INTEGER;
    new_code TEXT;
BEGIN
    -- Map department names to abbreviations
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
        ELSE 'GEN' -- General for unknown departments
    END;
    
    -- Get the next sequence number for this year and department
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(SPLIT_PART(code, '-', 3), '-', 1) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM user_profiles 
    WHERE code LIKE project_year || '-' || dept_abbrev || '-%';
    
    -- Format the code as YYYY-DEPT-NNN
    new_code := project_year || '-' || dept_abbrev || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$;

-- Update the auto_generate_user_code function to use project creation year and department
CREATE OR REPLACE FUNCTION public.auto_generate_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    project_year INTEGER;
    user_dept TEXT;
    new_code TEXT;
BEGIN
    IF NEW.code IS NULL THEN
        -- Get the year from created_at or current year
        project_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()));
        
        -- Get user's department from their latest project or default to 'GENERAL'
        SELECT COALESCE(p.department, 'GENERAL') INTO user_dept
        FROM projects p 
        WHERE p.user_id = NEW.id 
        ORDER BY p.created_at DESC 
        LIMIT 1;
        
        -- If no department found, use 'GENERAL'
        IF user_dept IS NULL THEN
            user_dept := 'GENERAL';
        END IF;
        
        -- Generate the new code
        NEW.code := generate_project_code(project_year, user_dept);
    END IF;
    RETURN NEW;
END;
$$;

-- Add a function to update project codes when projects are created
CREATE OR REPLACE FUNCTION public.update_user_code_on_project_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    project_year INTEGER;
    new_code TEXT;
BEGIN
    -- Get the year from project start_date
    project_year := EXTRACT(YEAR FROM NEW.start_date);
    
    -- Generate new code based on project year and department
    new_code := generate_project_code(project_year, COALESCE(NEW.department, 'GENERAL'));
    
    -- Update user's code if they don't have one or if it needs to be updated for this project year
    UPDATE user_profiles 
    SET code = new_code 
    WHERE id = NEW.user_id 
    AND (code IS NULL OR NOT code LIKE project_year || '-%');
    
    RETURN NEW;
END;
$$;

-- Create trigger for project creation to update user codes
DROP TRIGGER IF EXISTS update_user_code_on_project ON projects;
CREATE TRIGGER update_user_code_on_project
    AFTER INSERT ON projects
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_user_code_on_project_creation();