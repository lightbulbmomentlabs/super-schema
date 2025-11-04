-- Verification queries for migration 023
-- Run these in Supabase SQL Editor to verify the migration was successful

-- 1. Check if pending_hubspot_connections table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_hubspot_connections'
ORDER BY ordinal_position;

-- 2. Check if claim function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'claim_pending_hubspot_connection';

-- 3. Check if cleanup function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'cleanup_expired_pending_hubspot_connections';

-- 4. Check indexes on pending_hubspot_connections
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pending_hubspot_connections';

-- Expected results:
-- Query 1: Should show 11 columns (id, state_token, oauth_code, etc.)
-- Query 2: Should return 1 row with routine_type = 'FUNCTION'
-- Query 3: Should return 1 row with routine_type = 'FUNCTION'
-- Query 4: Should show 2 indexes (primary key + state_token unique)
