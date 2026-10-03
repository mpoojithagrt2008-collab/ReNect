/*
# Tighten chat access to accepted rentals

1. Purpose
- Ensure chat history is available only to the two users connected to an accepted or completed rental.
- Ensure a sender cannot forge the receiver ID or use a different rental request to start a conversation.

2. Modified database objects
- `messages`: replaces the participant read policy with an accepted/completed rental check.
- `messages`: replaces the insert policy with an accepted-rental participant and counterpart check.
- No message rows, rental rows, profiles, listings, or authentication data are deleted or changed.

3. Security changes
- Pending, rejected, and unrelated rental requests no longer expose chat history.
- A message can only be inserted when the authenticated sender is a participant in the accepted request and the receiver is the other participant in that same request.
- Existing authenticated access and realtime behavior remain available for authorized conversations.

4. Important notes
- The application continues to use the existing `messages` table and request IDs.
- The acceptance workflow is unchanged; this migration only narrows database access around it.
- Completed rentals retain their conversation history for both participants.
*/

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_accepted_participants"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rent_requests rr
    WHERE rr.id = messages.request_id
      AND rr.status IN ('accepted', 'completed')
      AND (rr.requester_id = auth.uid() OR rr.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;
CREATE POLICY "messages_insert_accepted_counterpart"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.rent_requests rr
    WHERE rr.id = messages.request_id
      AND rr.status = 'accepted'
      AND (
        (rr.owner_id = auth.uid() AND rr.requester_id = messages.receiver_id)
        OR (rr.requester_id = auth.uid() AND rr.owner_id = messages.receiver_id)
      )
  )
);
