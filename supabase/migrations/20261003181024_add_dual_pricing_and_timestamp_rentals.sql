/*
# Add dual pricing (per-hour + per-day) and timestamp-based rental periods

1. Purpose
- Add `price_per_hour` column to `listings` so owners can set both an hourly and a daily rate.
- Change `rent_requests.start_date` and `rent_requests.end_date` from `date` to `timestamptz` to support hourly rentals with specific date+time selection.
- The existing `price_per_day` column remains for the daily rate.
- The existing `pricing_type` column remains to indicate which rate is primary/active.

2. Modified Tables
- `listings`: added `price_per_hour integer NOT NULL DEFAULT 0`. This stores the hourly rate (0 = no hourly pricing).
- `rent_requests`: `start_date` changed from `date` to `timestamptz`, `end_date` changed from `date` to `timestamptz`. Existing date values will be cast to timestamps at midnight UTC.

3. Security
- No policy changes. No new tables.
- Existing RLS policies remain intact.

4. Important Notes
- `price_per_hour` defaults to 0 so existing listings are unaffected.
- Existing rent requests with date-only values will have time component 00:00:00 UTC after the cast.
- The `complete_expired_rentals` function already uses `CURRENT_DATE` comparison which works with timestamptz.
*/

-- 1. Add price_per_hour column to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_per_hour integer NOT NULL DEFAULT 0;

-- 2. Change start_date and end_date from date to timestamptz
-- We use USING clause to cast existing date values to timestamptz (at 00:00:00 UTC)
ALTER TABLE rent_requests ALTER COLUMN start_date TYPE timestamptz USING start_date::timestamptz;
ALTER TABLE rent_requests ALTER COLUMN end_date TYPE timestamptz USING end_date::timestamptz;
