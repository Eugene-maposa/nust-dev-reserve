-- Clear all data from tables (preserving schema)
-- Disable triggers temporarily to avoid issues
SET session_replication_role = replica;

-- Truncate all tables in correct order (respecting foreign keys)
TRUNCATE TABLE public.blog_posts CASCADE;
TRUNCATE TABLE public.blog_authors CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.password_reset_tokens CASCADE;
TRUNCATE TABLE public.user_profiles CASCADE;
TRUNCATE TABLE public.rooms CASCADE;
TRUNCATE TABLE public."USERS" CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;