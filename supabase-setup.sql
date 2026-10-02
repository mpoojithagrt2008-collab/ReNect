-- CampusLoop Database Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New Query)
-- This creates all tables, policies, and storage needed for the multi-user app.

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  student_id text DEFAULT '',
  college text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ LISTINGS ============
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  condition text NOT NULL DEFAULT 'Good',
  price_per_day integer NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT 'Campus',
  image_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_active" ON listings;
CREATE POLICY "listings_select_active"
ON listings FOR SELECT
TO authenticated USING (status = 'active');

DROP POLICY IF EXISTS "listings_insert_own" ON listings;
CREATE POLICY "listings_insert_own"
ON listings FOR INSERT
TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "listings_update_own" ON listings;
CREATE POLICY "listings_update_own"
ON listings FOR UPDATE
TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "listings_delete_own" ON listings;
CREATE POLICY "listings_delete_own"
ON listings FOR DELETE
TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings (owner_id);

-- ============ RENT_REQUESTS ============
CREATE TABLE IF NOT EXISTS rent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_parties" ON rent_requests;
CREATE POLICY "requests_select_parties"
ON rent_requests FOR SELECT
TO authenticated USING (auth.uid() = requester_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "requests_insert_requester" ON rent_requests;
CREATE POLICY "requests_insert_requester"
ON rent_requests FOR INSERT
TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "requests_update_owner" ON rent_requests;
CREATE POLICY "requests_update_owner"
ON rent_requests FOR UPDATE
TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON rent_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON rent_requests (requester_id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_public_read"
ON storage.objects FOR SELECT
TO public USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_auth_upload" ON storage.objects;
CREATE POLICY "listing_images_auth_upload"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_auth_delete" ON storage.objects;
CREATE POLICY "listing_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'listing-images');

-- ============ REALTIME ============
-- Enable realtime for listings table
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS listings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS rent_requests;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
-- This function automatically creates a profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
