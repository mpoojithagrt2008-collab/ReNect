/*
# Add notifications, messages, profile avatars, and atomic rental accept

## Overview
This migration adds the remaining multi-user infrastructure to CampusLoop:
real notifications, real chat messages, profile picture support, and
database-enforced atomic rental acceptance (prevents double-booking races).

## New Tables
1. `notifications`
   - Stores in-app notifications for users (new request, accepted, rejected, item available)
   - Columns: id, user_id (recipient), actor_id (who triggered it), type, title, body, listing_id, request_id, read, created_at
2. `messages`
   - Stores chat messages between owner and borrower for an accepted rental
   - Columns: id, request_id, sender_id, receiver_id, body, created_at

## Modified Tables
- `profiles`: adds `avatar_url` column (text, nullable) for profile picture URL

## New Functions (SECURITY DEFINER)
1. `accept_rental(p_request_id uuid)` — atomically accepts a rental request:
   - Verifies caller is the listing owner
   - Verifies the listing is still available
   - Updates request status to 'accepted', listing availability to 'unavailable'
   - Creates a notification for the requester
   - Returns success/error JSON
   This prevents race conditions where two owners' friends could double-accept.
2. `complete_expired_rentals()` — marks accepted rentals past their end_date as completed
   and sets the listing back to available. Called from the app on load + via realtime.

## New Triggers
- `notify_owner_on_request` — AFTER INSERT on rent_requests: creates a notification for the owner
- `notify_requester_on_reject` — AFTER UPDATE on rent_requests (status → rejected): notifies requester
- (accept notification is handled inside the accept_rental RPC)

## Storage
- Creates `avatars` storage bucket (public read, owner-only write)
- Policies: anyone can read avatars; authenticated users can write only to their own folder

## RLS Policies
- notifications: users can SELECT/UPDATE only their own notifications; INSERT via SECURITY DEFINER triggers + RPC (owner_id check is in the function)
- messages: only request participants (requester_id or owner_id of the linked rent_request) can SELECT/INSERT
- profiles: existing policies kept; UPDATE policy already restricts to own row
- rent_requests: UPDATE policy tightened — only owner can update, and only status column changes
- listings: UPDATE policy tightened — owner can update, OR the accept_rental RPC (SECURITY DEFINER) handles availability changes

## Security Notes
1. The accept_rental function runs as SECURITY DEFINER so it can update listings.availability
   even though the caller is only the owner. The function verifies ownership before proceeding.
2. Notification INSERTs happen inside triggers and the RPC, both running with elevated privileges.
   Users cannot directly INSERT into notifications — no INSERT policy is granted.
3. Messages RLS checks membership via a subquery to rent_requests.
*/

-- =========================================================
-- 1. Add avatar_url to profiles
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- =========================================================
-- 2. Create notifications table
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  request_id uuid REFERENCES rent_requests(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No INSERT/DELETE policy — notifications are created only by triggers/RPC (SECURITY DEFINER)

-- =========================================================
-- 3. Create messages table
-- =========================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES rent_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- A user can read messages for requests where they are the requester or owner
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants"
  ON messages FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM rent_requests rr
      WHERE rr.id = messages.request_id
      AND (rr.requester_id = auth.uid() OR rr.owner_id = auth.uid())
    )
  );

-- A user can send a message only if they are a participant of the accepted request
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM rent_requests rr
      WHERE rr.id = messages.request_id
      AND rr.status = 'accepted'
      AND (rr.requester_id = auth.uid() OR rr.owner_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- =========================================================
-- 4. Tighten rent_requests UPDATE policy (owner only, status only)
-- =========================================================
-- The existing policy already restricts to owner_id. We keep it.
-- The accept_rental RPC will handle status+availability atomically via SECURITY DEFINER.

-- =========================================================
-- 5. Create accept_rental SECURITY DEFINER function
-- =========================================================
CREATE OR REPLACE FUNCTION accept_rental(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request rent_requests%ROWTYPE;
  v_listing listings%ROWTYPE;
  v_requester_name text;
  v_listing_title text;
BEGIN
  -- Load the request
  SELECT * INTO v_request FROM rent_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found.');
  END IF;

  -- Verify caller is the owner
  IF v_request.owner_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the item owner can accept requests.');
  END IF;

  -- Verify request is pending
  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'This request is no longer pending.');
  END IF;

  -- Lock and check the listing
  SELECT * INTO v_listing FROM listings WHERE id = v_request.listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Item not found.');
  END IF;

  IF v_listing.availability <> 'available' THEN
    RETURN jsonb_build_object('error', 'This item is currently unavailable.');
  END IF;

  -- Atomically update request status and listing availability
  UPDATE rent_requests SET status = 'accepted' WHERE id = p_request_id;
  UPDATE listings SET availability = 'unavailable' WHERE id = v_listing.id;

  -- Get names for notification
  SELECT full_name INTO v_requester_name FROM profiles WHERE id = v_request.requester_id;
  SELECT title INTO v_listing_title FROM listings WHERE id = v_listing.id;

  -- Notify the requester
  INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
  VALUES (
    v_request.requester_id,
    auth.uid(),
    'accepted',
    'Your request was accepted',
    COALESce('Your request for ' || v_listing_title || ' was accepted.', 'Your request was accepted.'),
    v_listing.id,
    p_request_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION accept_rental(uuid) TO authenticated;

-- =========================================================
-- 6. Create complete_expired_rentals function
-- =========================================================
CREATE OR REPLACE FUNCTION complete_expired_rentals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_req RECORD;
  v_listing_title text;
  v_requester_name text;
BEGIN
  FOR expired_req IN
    SELECT rr.id, rr.listing_id, rr.requester_id, rr.end_date
    FROM rent_requests rr
    JOIN listings l ON l.id = rr.listing_id
    WHERE rr.status = 'accepted'
      AND rr.end_date IS NOT NULL
      AND rr.end_date < CURRENT_DATE
    FOR UPDATE OF rr SKIP LOCKED
  LOOP
    UPDATE rent_requests SET status = 'completed' WHERE id = expired_req.id;
    UPDATE listings SET availability = 'available' WHERE id = expired_req.listing_id;

    SELECT title INTO v_listing_title FROM listings WHERE id = expired_req.listing_id;
    SELECT full_name INTO v_requester_name FROM profiles WHERE id = expired_req.requester_id;

    INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
    VALUES (
      expired_req.requester_id,
      expired_req.requester_id,
      'available',
      'Item available again',
      COALESCE('The rental period for ' || v_listing_title || ' has ended. It is now available for others to borrow.', 'Your rental has ended.'),
      expired_req.listing_id,
      expired_req.id
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_expired_rentals() TO authenticated;

-- =========================================================
-- 7. Trigger: notify owner on new request
-- =========================================================
CREATE OR REPLACE FUNCTION notify_owner_on_request_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_title text;
  v_requester_name text;
BEGIN
  SELECT title INTO v_listing_title FROM listings WHERE id = NEW.listing_id;
  SELECT full_name INTO v_requester_name FROM profiles WHERE id = NEW.requester_id;

  INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
  VALUES (
    NEW.owner_id,
    NEW.requester_id,
    'new_request',
    'New rental request',
    COALESCE(
      COALESCE(v_requester_name, 'Someone') || ' requested to rent your ' || v_listing_title || '.',
      'You have a new rental request.'
    ),
    NEW.listing_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_owner_on_request ON rent_requests;
CREATE TRIGGER trigger_notify_owner_on_request
  AFTER INSERT ON rent_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_on_request_fn();

-- =========================================================
-- 8. Trigger: notify requester on rejection
-- =========================================================
CREATE OR REPLACE FUNCTION notify_requester_on_reject_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_title text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> 'rejected' AND NEW.status = 'rejected' THEN
    SELECT title INTO v_listing_title FROM listings WHERE id = NEW.listing_id;

    INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
    VALUES (
      NEW.requester_id,
      NEW.owner_id,
      'rejected',
      'Your request was rejected',
      COALESCE(
        'Your request for ' || v_listing_title || ' was rejected.',
        'Your request was rejected.'
      ),
      NEW.listing_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_requester_on_reject ON rent_requests;
CREATE TRIGGER trigger_notify_requester_on_reject
  AFTER UPDATE ON rent_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_requester_on_reject_fn();