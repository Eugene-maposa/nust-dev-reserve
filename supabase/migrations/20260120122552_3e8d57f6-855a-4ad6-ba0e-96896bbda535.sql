-- Sync existing admin users from user_profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.user_profiles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add unique constraint if not exists to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_unique'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);
  END IF;
END $$;

-- Create trigger to auto-sync user_profiles role to user_roles
CREATE OR REPLACE FUNCTION public.sync_user_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old role if changing
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
  END IF;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.user_profiles;
CREATE TRIGGER sync_profile_role_trigger
AFTER INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_role();