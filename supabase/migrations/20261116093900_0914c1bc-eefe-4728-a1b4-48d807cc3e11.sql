ALTER FUNCTION public.check_password_requirements(text) SET search_path = public;
ALTER FUNCTION public.check_user_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.generate_password_reset_token(text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.reset_admin_password(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.update_password_with_validation(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.update_user_password(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.update_user_role(uuid, character varying, jsonb) SET search_path = public;
ALTER FUNCTION public.validate_password_reset_token(text, text) SET search_path = public, extensions;

-- Server-only / trigger functions: nobody calls these from the app
REVOKE EXECUTE ON FUNCTION public.check_user_permission(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_password_reset_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_admin_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_password_with_validation(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_role(uuid, character varying, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_password_reset_token(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_permission(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, character varying, jsonb) TO service_role;