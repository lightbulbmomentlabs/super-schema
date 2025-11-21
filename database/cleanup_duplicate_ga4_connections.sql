-- ============================================================
-- GA4 Connections Cleanup Script
-- ============================================================
-- Purpose: Remove duplicate GA4 connections, keeping only the
--          most recent connection for each unique Google account email
--
-- Date: 2025-11-20
-- IMPORTANT: Review the preview queries before running DELETE!
-- ============================================================

-- STEP 1: PREVIEW - See what will be kept (DO NOT DELETE THIS)
-- Run this first to see which connections will be preserved
-- ============================================================
SELECT
  id,
  user_id,
  google_account_email,
  is_active,
  connected_at,
  'WILL BE KEPT' as status
FROM ga4_connections
WHERE id IN (
  -- Keep the most recent connection for each user + email combination
  SELECT DISTINCT ON (user_id, google_account_email) id
  FROM ga4_connections
  ORDER BY user_id, google_account_email, connected_at DESC
)
ORDER BY user_id, google_account_email, connected_at DESC;

-- STEP 2: PREVIEW - See what will be deleted (DO NOT DELETE THIS)
-- Run this to see which connections will be removed
-- ============================================================
SELECT
  id,
  user_id,
  google_account_email,
  is_active,
  connected_at,
  'WILL BE DELETED' as status
FROM ga4_connections
WHERE id NOT IN (
  -- Keep the most recent connection for each user + email combination
  SELECT DISTINCT ON (user_id, google_account_email) id
  FROM ga4_connections
  ORDER BY user_id, google_account_email, connected_at DESC
)
ORDER BY user_id, google_account_email, connected_at DESC;

-- STEP 3: ACTUAL CLEANUP - Delete duplicates
-- ============================================================
-- CAUTION: Only run this after reviewing STEP 1 and STEP 2 above!
-- This will permanently delete duplicate connections.
-- ============================================================

BEGIN;

-- First, deactivate all connections that will be kept (we'll reactivate the most recent one)
UPDATE ga4_connections
SET is_active = false
WHERE id IN (
  SELECT DISTINCT ON (user_id, google_account_email) id
  FROM ga4_connections
  ORDER BY user_id, google_account_email, connected_at DESC
);

-- Delete duplicate connections (keep only most recent per user + email)
DELETE FROM ga4_connections
WHERE id NOT IN (
  -- Keep the most recent connection for each user + email combination
  SELECT DISTINCT ON (user_id, google_account_email) id
  FROM ga4_connections
  ORDER BY user_id, google_account_email, connected_at DESC
);

-- Set the most recent connection for each user as active
UPDATE ga4_connections
SET is_active = true
WHERE id IN (
  -- Get the most recent connection for each user (regardless of email)
  SELECT DISTINCT ON (user_id) id
  FROM ga4_connections
  ORDER BY user_id, connected_at DESC
);

-- Show final state
SELECT
  id,
  user_id,
  google_account_email,
  is_active,
  connected_at,
  'FINAL STATE' as status
FROM ga4_connections
ORDER BY user_id, connected_at DESC;

-- If everything looks good, commit the transaction
-- COMMIT;

-- If something looks wrong, rollback instead
-- ROLLBACK;

-- ============================================================
-- INSTRUCTIONS:
-- ============================================================
-- 1. Run STEP 1 query to see what will be kept
-- 2. Run STEP 2 query to see what will be deleted
-- 3. Verify the results look correct
-- 4. Run STEP 3 (the BEGIN...COMMIT block)
-- 5. Review the "FINAL STATE" output
-- 6. If it looks good, uncomment and run: COMMIT;
-- 7. If it looks wrong, uncomment and run: ROLLBACK;
-- ============================================================
