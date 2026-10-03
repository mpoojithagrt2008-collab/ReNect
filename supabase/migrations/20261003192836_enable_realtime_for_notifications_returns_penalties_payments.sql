/*
# Enable Realtime for Notifications, Returns, Damage Penalties, and Payments

## Purpose
The frontend already has realtime channels subscribed to the `notifications`,
`returns`, `damage_penalties`, and `payments` tables, but these tables were
never added to the `supabase_realtime` publication. This means INSERT/UPDATE
events on these tables never reach the frontend, so users must reload the page
to see new notifications, return updates, penalty updates, or payment updates.

## Changes
1. Add `notifications` table to `supabase_realtime` publication.
2. Add `returns` table to `supabase_realtime` publication.
3. Add `damage_penalties` table to `supabase_realtime` publication.
4. Add `payments` table to `supabase_realtime` publication.
5. Set `REPLICA IDENTITY FULL` on `notifications` so UPDATE events
   (mark-as-read) include all columns, enabling the frontend to detect
   read-status changes in real-time.

## Security
- No RLS or policy changes. RLS remains enforced on all tables.
- Realtime respects RLS: users only receive events for rows they can read.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'returns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.returns;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'damage_penalties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.damage_penalties;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.returns REPLICA IDENTITY FULL;
ALTER TABLE public.damage_penalties REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
