-- Migration: 027_ga4_multi_account_support.sql
-- Purpose: Enable users to connect multiple Google Analytics accounts
-- Date: 2025-11-19
-- Description:
--   - Removes UNIQUE constraint on user_id to allow multiple connections per user
--   - Adds google_account_email column for account identification
--   - Adds is_active flag to track which connection is currently active
--   - Ensures only ONE active connection per user at a time via unique index

-- Step 1: Add new columns
ALTER TABLE ga4_connections
ADD COLUMN IF NOT EXISTS google_account_email TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: For existing connections, ensure they are marked as active
UPDATE ga4_connections SET is_active = true WHERE is_active IS NULL;

-- Step 3: Remove old UNIQUE constraint on user_id (allows multiple connections per user)
ALTER TABLE ga4_connections DROP CONSTRAINT IF EXISTS ga4_connections_user_id_key;

-- Step 4: Create partial unique index to ensure only ONE active connection per user at a time
-- This allows multiple connections per user, but only one can be active
CREATE UNIQUE INDEX IF NOT EXISTS one_active_connection_per_user
  ON ga4_connections(user_id)
  WHERE is_active = true;

-- Step 5: Add helpful index for querying active connections
CREATE INDEX IF NOT EXISTS idx_ga4_connections_user_active
  ON ga4_connections(user_id, is_active);

-- Step 6: Add index on google_account_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_ga4_connections_email
  ON ga4_connections(google_account_email);

-- ============================================================
-- IMPORTANT NOTES:
-- ============================================================
-- 1. Existing single connections will automatically become "active"
-- 2. No data loss - all existing connections preserved
-- 3. The partial unique index ensures data integrity (one active per user)
-- 4. When adding new connections via OAuth, set is_active=true and
--    deactivate other connections for that user
-- 5. google_account_email is populated during OAuth from Google userinfo

-- ============================================================
-- ROLLBACK (if needed):
-- ============================================================
-- DROP INDEX IF EXISTS one_active_connection_per_user;
-- DROP INDEX IF EXISTS idx_ga4_connections_user_active;
-- DROP INDEX IF EXISTS idx_ga4_connections_email;
-- ALTER TABLE ga4_connections DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE ga4_connections DROP COLUMN IF EXISTS google_account_email;
-- ALTER TABLE ga4_connections ADD CONSTRAINT ga4_connections_user_id_key UNIQUE(user_id);
