/*
# Update complete_expired_rentals to send rating notification

1. Changes
- Replaces the "available" notification with a "rental_completed" notification
- New message: "Your rental has been completed. Please rate the product."
- Also sends an "available" notification to the OWNER so they know the item is available again
2. Security
- Function is SECURITY DEFINER, same as before
- search_path stays 'public'
*/

CREATE OR REPLACE FUNCTION public.complete_expired_rentals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
expired_req RECORD;
v_listing_title text;
BEGIN
FOR expired_req IN
SELECT rr.id, rr.listing_id, rr.requester_id, rr.owner_id, rr.end_date
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

-- Notify borrower: rental completed, please rate
INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
VALUES (
  expired_req.requester_id,
  expired_req.requester_id,
  'rental_completed',
  'Rental completed',
  'Your rental has been completed. Please rate the product.',
  expired_req.listing_id,
  expired_req.id
);

-- Notify owner: item available again
INSERT INTO notifications (user_id, actor_id, type, title, body, listing_id, request_id)
VALUES (
  expired_req.owner_id,
  expired_req.requester_id,
  'available',
  'Item available again',
  COALESCE('The rental period for ' || v_listing_title || ' has ended. It is now available for others to borrow.', 'Your rental has ended.'),
  expired_req.listing_id,
  expired_req.id
);
END LOOP;
END;
$function$;