/*
# Fix confirm_return RPC to accept rentals in 'completed' state

## Problem
The `complete_expired_rentals()` function marks accepted rentals as 'completed'
when their end date passes, but leaves the listing 'unavailable' until the owner
confirms the return. However, `confirm_return()` only accepted rentals with
status = 'accepted', so when an expired rental had a pending return, the owner
got "This rental is not in an active state." instead of being able to confirm.

## Fix
- `confirm_return` now accepts rentals with status IN ('accepted', 'completed').
  This covers both: active rentals where the renter returned early, and expired
  rentals that were auto-completed by the timer but still need return confirmation.
- The listing is set to 'available' only here (the single source of truth for
  return confirmation), never in complete_expired_rentals.
- Duplicate confirmation is still prevented by checking return.status = 'submitted'.

## Data fix
- Any stuck returns (status='submitted' on rentals already 'completed' with
  listings still 'unavailable') will now be confirmable by the owner.
*/

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

  -- Accept both 'accepted' (active rental) and 'completed' (expired rental
  -- auto-completed by complete_expired_rentals, but return still pending).
  -- Do NOT accept 'pending', 'rejected', or 'cancelled'.
  IF v_request.status NOT IN ('accepted', 'completed') THEN
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