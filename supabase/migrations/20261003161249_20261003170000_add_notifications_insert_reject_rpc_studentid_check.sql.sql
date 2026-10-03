/*
# Notification INSERT policy, reject_rental RPC, student_id validation

## Changes

### 1. Notifications INSERT policy
- Allows authenticated users to INSERT notification rows for other users
  (e.g. borrower notifies owner of a new request).
- SELECT and UPDATE policies already restrict reads/updates to auth.uid() = user_id.

### 2. reject_rental RPC (SECURITY DEFINER)
- Verifies caller is the item owner.
- Verifies request is still pending.
- Updates request status to 'rejected'.
- Sends a 'rejected' notification to the borrower.
- Product remains available (no availability change needed for rejection).

### 3. Clean up existing profile student_id values
- Profiles with student_id values that don't match ^[RSON][0-9]{5}$ are set to ''.
- This allows the CHECK constraint to be added without violating existing rows.

### 4. student_id CHECK constraint on profiles
- Enforces: student_id = '' OR student_id ~ '^[RSON][0-9]{5}$'
- Backend enforcement of the college ID format.
*/

-- 1. Notifications INSERT policy
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
CREATE POLICY "notifications_insert_authenticated"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. reject_rental RPC
CREATE OR REPLACE FUNCTION public.reject_rental(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_request rent_requests%ROWTYPE;
  v_listing_title text;
BEGIN
  SELECT * INTO v_request FROM rent_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found.');
  END IF;

  IF v_request.owner_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the item owner can reject requests.');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'This request is no longer pending.');
  END IF;

  UPDATE rent_requests SET status = 'rejected' WHERE id = p_request_id;

  SELECT title INTO v_listing_title FROM listings WHERE id = v_request.listing_id;

  INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
  VALUES (
    v_request.requester_id,
    auth.uid(),
    'rejected',
    'Your request was rejected',
    COALESCE('Your request for ' || v_listing_title || ' was rejected by the owner.', 'Your request was rejected.'),
    v_request.listing_id,
    p_request_id
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 3. Clean up non-conforming student_id values
UPDATE profiles SET student_id = '' WHERE student_id !~ '^[RSON][0-9]{5}$';

-- 4. student_id CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_student_id_format_check'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_student_id_format_check
    CHECK (student_id = '' OR student_id ~ '^[RSON][0-9]{5}$');
  END IF;
END $$;