/*
# Update student_id CHECK constraint from 6 to 7 characters

## Changes
- Drops the old constraint profiles_student_id_format_check that enforced ^[RSON][0-9]{5}$
- Adds a new constraint enforcing ^[RSON][0-9]{6}$ (7 characters: R/S/O/N + 6 digits)
- Existing profiles all have student_id = '' so no rows violate the new constraint
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_student_id_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_student_id_format_check
CHECK (student_id = '' OR student_id ~ '^[RSON][0-9]{6}$');