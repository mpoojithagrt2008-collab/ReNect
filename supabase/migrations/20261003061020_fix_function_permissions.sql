/*
# Fix SECURITY DEFINER function permissions

## Overview
The `handle_new_user()` trigger function was callable via the REST API by anon and authenticated roles. This is a trigger function that should only be invoked by the database trigger on auth.users, not via REST.

## Security Changes
- Revoke EXECUTE on `handle_new_user()` from anon and authenticated roles
- The trigger on auth.users still works because it runs with superuser privileges
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
