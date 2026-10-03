/*
# Add favorites, reviews tables, and enable realtime for messages

## Overview
This migration adds two new tables — `favorites` and `reviews` — and enables
Supabase Realtime publication on the `messages` table so chat messages are
delivered instantly to both participants without requiring a reply first.

## New Tables
1. `favorites`
   - Stores user wishlist/favorite items.
   - Columns: id, user_id, listing_id, created_at
   - Unique constraint on (user_id, listing_id) to prevent duplicate favorites.

2. `reviews`
   - Stores ratings and written feedback for completed rentals.
   - Columns: id, request_id, listing_id, reviewer_id, rating (1-5), feedback, created_at
   - Unique constraint on request_id — one review per completed rental.
   - CHECK constraint: rating must be between 1 and 5.

## Realtime
- Adds `messages` table to the `supabase_realtime` publication so INSERT events
  are broadcast to all subscribers immediately. This fixes the chat delivery bug
  where messages only appeared after the recipient sent a reply.
- Also adds `favorites` and `reviews` to the realtime publication for instant UI updates.

## RLS Policies
- favorites: users can SELECT/INSERT/DELETE only their own favorites.
- reviews: anyone can SELECT (public ratings), but only the requester of a
  completed rental can INSERT a review for that rental. Users can only
  review rentals they made (reviewer_id = auth.uid()).

## Security Notes
1. favorites.user_id defaults to auth.uid() — client doesn't need to pass it.
2. reviews.reviewer_id defaults to auth.uid() — client doesn't need to pass it.
3. The INSERT policy on reviews checks that the linked rent_request has
   status = 'completed' AND the caller is the requester, preventing reviews
   on unrented items, incomplete rentals, or someone else's rental.
*/

-- =========================================================
-- 1. Create favorites table
-- =========================================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- =========================================================
-- 2. Create reviews table
-- =========================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES rent_requests(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (they are public)
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT TO authenticated
  USING (true);

-- Only the requester of a completed rental can submit a review
DROP POLICY IF EXISTS "reviews_insert_completed_renter" ON reviews;
CREATE POLICY "reviews_insert_completed_renter"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM rent_requests rr
      WHERE rr.id = reviews.request_id
      AND rr.requester_id = auth.uid()
      AND rr.status = 'completed'
    )
  );

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);

-- =========================================================
-- 3. Enable Realtime for messages, favorites, reviews
-- =========================================================
DO $$
BEGIN
  -- Add messages to realtime publication (fixes chat delivery bug)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- Add favorites to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'favorites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE favorites;
  END IF;

  -- Add reviews to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  END IF;
END $$;
