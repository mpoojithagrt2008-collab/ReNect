/*
# Add confirm_return RPC and owner UPDATE policy on returns table

## Purpose
Implements the owner-side return confirmation flow:
1. Renter submits a return (status='submitted') — already exists.
2. Owner reviews the return photo and note.
3. Owner clicks "Confirm Return" — calls confirm_return RPC.
4. RPC atomically: verifies owner, verifies return is 'submitted', updates return status to 'reviewed', completes the rental (rent_requests.status='completed'), marks the listing as 'available', and notifies the renter.

## Changes
### 1. New RPC: confirm_return(p_return_id uuid)
- SECURITY DEFINER so it can update listings.availability (which the owner RLS policy on listings doesn't cover for availability changes done via RPC).
- Verifies the caller is the owner of the associated rental.
- Verifies the return status is 'submitted' (prevents duplicate confirmations).
- Updates return.status to 'reviewed'.
- Updates rent_requests.status to 'completed'.
- Updates listings.availability to 'available'.
- Inserts a notification for the renter: "Return confirmed".

### 2. New UPDATE policy on returns table: returns_update_owner
- Allows the listing owner (via rent_requests.owner_id) to update the return record.
- This is needed so the RPC (running as SECURITY DEFINER) can update returns, and also so the frontend could update if needed.

## Security
- The RPC runs as SECURITY DEFINER with search_path = public.
- Only the rental owner can call it (verified inside).
- Prevents duplicate confirmations (checks status = 'submitted').
- GRANT EXECUTE TO authenticated only.

## Notes
- The existing markReturned function in the frontend remains for backward compatibility but the new flow uses confirm_return instead.
- No data is lost — existing 'submitted' returns remain unchanged.
- The RPC is idempotent-safe: if called again after status='reviewed', it returns an error message.
*/

-- 1. Add UPDATE policy for owners on returns table
DROP POLICY IF EXISTS "returns_update_owner" ON returns;
CREATE POLICY "returns_update_owner"
ON returns FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rent_requests rr
    WHERE rr.id = returns.request_id AND rr.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rent_requests rr
    WHERE rr.id = returns.request_id AND rr.owner_id = auth.uid()
  )
);

-- 2. Create confirm_return RPC
CREATE OR REPLACE FUNCTION confirm_return(p_return_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_return returns%ROWTYPE;
  v_request rent_requests%ROWTYPE;
  v_listing listings%ROWTYPE;
  v_renter_name text;
  v_listing_title text;
BEGIN
  -- Load the return record with FOR UPDATE to prevent concurrent modifications
  SELECT * INTO v_return FROM returns WHERE id = p_return_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Return record not found.');
  END IF;

  -- Verify the return is still pending (submitted)
  IF v_return.status <> 'submitted' THEN
    RETURN jsonb_build_object('error', 'This return has already been confirmed.');
  END IF;

  -- Load the associated rental request
  SELECT * INTO v_request FROM rent_requests WHERE id = v_return.request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Rental request not found.');
  END IF;

  -- Verify caller is the owner
  IF v_request.owner_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the item owner can confirm returns.');
  END IF;

  -- Verify the rental is in accepted state
  IF v_request.status <> 'accepted' THEN
    RETURN jsonb_build_object('error', 'This rental is not in an active state.');
  END IF;

  -- Load the listing
  SELECT * INTO v_listing FROM listings WHERE id = v_return.listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Item not found.');
  END IF;

  -- Atomically: update return status, complete rental, make item available
  UPDATE returns SET status = 'reviewed' WHERE id = p_return_id;
  UPDATE rent_requests SET status = 'completed' WHERE id = v_request.id;
  UPDATE listings SET availability = 'available' WHERE id = v_listing.id;

  -- Get names for notification
  SELECT full_name INTO v_renter_name FROM profiles WHERE id = v_request.requester_id;
  SELECT title INTO v_listing_title FROM listings WHERE id = v_listing.id;

  -- Notify the renter that the return has been confirmed
  INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
  VALUES (
    v_request.requester_id,
    auth.uid(),
    'rental_completed',
    'Return confirmed',
    COALESCE(
      'The owner has confirmed your return for ' || v_listing_title || '. The rental is now complete. Please rate the product.',
      'Your return has been confirmed. The rental is now complete.'
    ),
    v_listing.id,
    v_request.id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_return(uuid) TO authenticated;
