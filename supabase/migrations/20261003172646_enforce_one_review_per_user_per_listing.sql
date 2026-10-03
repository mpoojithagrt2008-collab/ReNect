/*
# Enforce one review per user per product

1. Purpose
- Prevent the same authenticated user from creating duplicate reviews for the same listing.
- Preserve the existing ability for many different users to review the same listing.

2. Modified database objects
- `reviews`: adds a unique index over `reviewer_id` and `listing_id`.
- No tables, columns, existing review rows, profiles, listings, or rental records are removed or changed.

3. Security
- The existing RLS policies remain in place.
- The existing insert policy continues to require that the reviewer is the authenticated user and that the related rental is completed.
- The unique index provides database-enforced duplicate prevention rather than relying only on the interface.

4. Important notes
- Average ratings continue to be calculated from all review rows.
- Multiple users can still review the same product.
- Existing data was checked before applying this change and contains no duplicate user/product review pairs.
*/

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_user_per_listing_idx
ON public.reviews (reviewer_id, listing_id);
