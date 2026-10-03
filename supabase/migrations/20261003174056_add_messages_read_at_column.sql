/*
# Add read_at column to messages for unread tracking

1. Purpose
- Track when a message has been read by its recipient, enabling unread message counts per conversation.

2. New Columns
- `messages.read_at` (timestamptz, nullable): set to now() when the receiver reads the message. NULL means unread.

3. Security
- Adds an UPDATE policy so the receiver of a message can mark it as read.
- No existing rows are modified; existing messages remain read_at = NULL (treated as unread until opened).

4. Important notes
- Only the receiver can update read_at; the sender cannot.
- The existing SELECT and INSERT policies remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read_at timestamptz;
  END IF;
END $$;

DROP POLICY IF EXISTS "messages_update_receiver_read" ON public.messages;
CREATE POLICY "messages_update_receiver_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = receiver_id
    AND EXISTS (
      SELECT 1 FROM public.rent_requests rr
      WHERE rr.id = messages.request_id
        AND rr.status IN ('accepted', 'completed')
        AND (rr.requester_id = auth.uid() OR rr.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = receiver_id
  );

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id) WHERE read_at IS NULL;
