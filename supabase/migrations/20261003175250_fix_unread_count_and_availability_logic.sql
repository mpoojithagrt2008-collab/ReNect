/*
# Fix unread message count and rental availability logic

1. Purpose
- Mark all existing messages as read (read_at = now()) so the unread badge only counts genuinely new/unread messages going forward. Before the read_at column existed, all messages were delivered without read tracking, so treating them all as unread produces a stale hardcoded-looking count.
- Stop the complete_expired_rentals function from auto-restoring listing availability to 'available'. The item must remain unavailable until the owner explicitly marks it as returned.

2. Modified database objects
- `messages`: existing rows updated to set read_at = now() (one-time data fix).
- `complete_expired_rentals()`: function body modified so it sets request status to 'completed' but does NOT change listing availability. The listing stays 'unavailable' until the owner calls markReturned.

3. Security
- No policy changes. No new tables or columns.
- The one-time update runs as a migration (privileged role), not as user code.
- complete_expired_rentals remains SECURITY DEFINER with the same grants.

4. Important notes
- This does not delete any messages or rental records.
- After this migration, the unread message badge will show 0 until new unread messages arrive.
- Items will stay unavailable after the rental period ends until the owner confirms the return via the existing markReturned flow.
*/

-- 1. Mark all existing messages as read so the unread count starts at 0
UPDATE public.messages SET read_at = now() WHERE read_at IS NULL;

-- 2. Recreate complete_expired_rentals WITHOUT changing listing availability
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
    -- Mark the request as completed but do NOT change listing availability.
    -- The item stays unavailable until the owner confirms the return.
    UPDATE rent_requests SET status = 'completed' WHERE id = expired_req.id;

    SELECT title INTO v_listing_title FROM listings WHERE id = expired_req.listing_id;
    SELECT full_name INTO v_requester_name FROM profiles WHERE id = expired_req.requester_id;

    INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
    VALUES (
      expired_req.requester_id,
      expired_req.requester_id,
      'available',
      'Rental period ended',
      COALESCE('The rental period for ' || v_listing_title || ' has ended. The owner must confirm the return before it becomes available again.', 'Your rental period has ended.'),
      expired_req.listing_id,
      expired_req.id
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_expired_rentals() TO authenticated;
