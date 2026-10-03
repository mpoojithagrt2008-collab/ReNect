/*
# Add Cancel Rental RPC

## Purpose
Allows a renter to cancel their own pending rental request. This atomically
verifies ownership and pending status, updates the request to 'cancelled',
and notifies the owner that the request was cancelled.

## Changes
1. Create `cancel_rental(p_request_id uuid)` SECURITY DEFINER function.
   - Verifies the caller is the requester (not the owner).
   - Verifies the request status is still 'pending'.
   - Updates status to 'cancelled'.
   - Sends a 'request_cancelled' notification to the owner.
2. Grant EXECUTE to authenticated role.

## Security
- SECURITY DEFINER so the function can update rent_requests and insert notifications.
- Only the original requester can cancel — verified via auth.uid() = requester_id.
- Only pending requests can be cancelled — prevents cancelling accepted/rejected/completed rentals.
- The existing accept_rental RPC already checks `status <> 'pending'` and returns
  "This request is no longer pending." so the owner cannot accept a cancelled request.
- RLS remains unchanged. The cancelled status is just another status value; no schema change needed.
*/

CREATE OR REPLACE FUNCTION public.cancel_rental(p_request_id uuid)
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

  IF v_request.requester_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the requester can cancel this request.');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'This request is no longer pending and cannot be cancelled.');
  END IF;

  UPDATE rent_requests SET status = 'cancelled' WHERE id = p_request_id;

  SELECT title INTO v_listing_title FROM listings WHERE id = v_request.listing_id;

  INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
  VALUES (
    v_request.owner_id,
    auth.uid(),
    'request_cancelled',
    'Rental request cancelled',
    COALESCE('The rental request for ' || v_listing_title || ' has been cancelled by the requester.', 'A rental request has been cancelled.'),
    v_request.listing_id,
    p_request_id
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.cancel_rental(uuid) TO authenticated;
