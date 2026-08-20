/*
  # Add missing organizations table, profiles table, and delete_organization RPC

  These objects existed in the original Supabase project but had no migration files.
  This migration recreates them so the new project has full feature parity.

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `created_at` (timestamptz)

    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `username` (text)
      - `organization_name` (text)
      - `state` (text)
      - `country` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - `delete_organization(org_name text)` — deletes an org and all associated data

  3. Triggers
    - `handle_new_user` — auto-creates a profile row when a new user signs up

  4. Security
    - RLS enabled on both tables with appropriate policies
*/

-- =============================================
-- 1. ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, authenticated users can insert
CREATE POLICY "Allow public read access on organizations"
  ON organizations FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on organizations"
  ON organizations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on organizations"
  ON organizations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on organizations"
  ON organizations FOR DELETE TO authenticated USING (true);

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);


-- =============================================
-- 2. PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  username text,
  organization_name text,
  state text,
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access on profiles"
  ON profiles FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_name ON profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- =============================================
-- 3. TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, organization_name, state, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'state', NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger first if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 4. RPC: delete_organization
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_organization(org_name text)
RETURNS void AS $$
BEGIN
  -- Delete all data_rows associated with users from this organization
  DELETE FROM public.data_rows
  WHERE user_id IN (
    SELECT id FROM public.profiles WHERE organization_name = org_name
  );

  -- Also delete data_rows that have the organization_name directly
  DELETE FROM public.data_rows
  WHERE organization_name = org_name;

  -- Delete profiles for this organization
  DELETE FROM public.profiles
  WHERE organization_name = org_name;

  -- Delete the organization itself
  DELETE FROM public.organizations
  WHERE name = org_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
