/*
  # Fix missing GRANT permissions on organizations and profiles tables

  Without explicit GRANTs, the Supabase anon and authenticated roles
  cannot access these tables through the PostgREST API, even with
  permissive RLS policies. This caused:
  - Organizations dropdown appearing empty
  - Profiles not being readable for login-by-organization
  - Various "row-level security" errors on write operations

  This migration grants the necessary permissions to make the API work.
*/

-- Grant permissions on organizations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Also ensure the delete_organization function is executable
GRANT EXECUTE ON FUNCTION public.delete_organization(text) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
