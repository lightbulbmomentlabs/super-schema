-- Pre-Migration Validation Checks
-- Run these queries BEFORE executing team migration to establish baseline

-- =============================================================================
-- 1. USER DATA BASELINE
-- =============================================================================

SELECT '=== USER DATA BASELINE ===' AS check_section;

-- Total users
SELECT COUNT(*) AS total_users FROM users;

-- Active users
SELECT COUNT(*) AS active_users FROM users WHERE is_active = true;

-- Users with credits
SELECT COUNT(*) AS users_with_credits FROM users WHERE credit_balance > 0;

SELECT SUM(credit_balance) AS total_credits_in_system FROM users;

-- =============================================================================
-- 2. RESOURCE DATA BASELINE
-- =============================================================================

SELECT '=== RESOURCE DATA BASELINE ===' AS check_section;

-- Total schemas generated
SELECT COUNT(*) AS total_schemas FROM schema_generations;

-- Total discovered URLs
SELECT COUNT(*) AS total_urls FROM discovered_urls;

-- Total credit transactions
SELECT COUNT(*) AS total_credit_transactions FROM credit_transactions;

-- Total HubSpot connections
SELECT COUNT(*) AS total_hubspot_connections FROM hubspot_connections;

-- =============================================================================
-- 3. DATA INTEGRITY CHECKS
-- =============================================================================

SELECT '=== DATA INTEGRITY CHECKS ===' AS check_section;

-- Orphaned schemas (schema with non-existent user)
SELECT COUNT(*) AS orphaned_schemas
FROM schema_generations sg
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = sg.user_id);

-- Orphaned URLs (URL with non-existent user)
SELECT COUNT(*) AS orphaned_urls
FROM discovered_urls du
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = du.user_id);

-- Orphaned credit transactions
SELECT COUNT(*) AS orphaned_credit_transactions
FROM credit_transactions ct
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ct.user_id);

-- =============================================================================
-- 4. VERIFY NO EXISTING TEAM DATA
-- =============================================================================

SELECT '=== VERIFY NO TEAM DATA EXISTS ===' AS check_section;

-- These queries should fail if tables don't exist (expected before migration)
-- If they return data, migration may have already been partially run

-- Uncomment after migration tables exist:
-- SELECT COUNT(*) AS existing_teams FROM teams;
-- SELECT COUNT(*) AS existing_team_members FROM team_members;
-- SELECT COUNT(*) AS existing_team_invites FROM team_invites;

-- =============================================================================
-- 5. SAMPLE DATA SNAPSHOT (for comparison after migration)
-- =============================================================================

SELECT '=== SAMPLE USER SNAPSHOT ===' AS check_section;

-- Get 5 sample users with their resource counts
SELECT
  u.id,
  u.email,
  u.credit_balance,
  (SELECT COUNT(*) FROM schema_generations WHERE user_id = u.id) AS schema_count,
  (SELECT COUNT(*) FROM discovered_urls WHERE user_id = u.id) AS url_count,
  (SELECT COUNT(*) FROM credit_transactions WHERE user_id = u.id) AS transaction_count
FROM users u
ORDER BY u.created_at
LIMIT 5;

-- =============================================================================
-- 6. CRITICAL WARNINGS
-- =============================================================================

SELECT '=== CRITICAL WARNINGS ===' AS check_section;

-- Check for NULL user_ids (would indicate data corruption)
SELECT
  'CRITICAL: NULL user_ids found in schema_generations' AS warning
FROM schema_generations
WHERE user_id IS NULL
LIMIT 1;

SELECT
  'CRITICAL: NULL user_ids found in discovered_urls' AS warning
FROM discovered_urls
WHERE user_id IS NULL
LIMIT 1;

-- Check for duplicate user emails (Clerk should prevent this, but verify)
SELECT
  'WARNING: Duplicate emails found' AS warning,
  email,
  COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT '=== PRE-MIGRATION SUMMARY ===' AS check_section;

SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM schema_generations) AS total_schemas,
  (SELECT COUNT(*) FROM discovered_urls) AS total_urls,
  (SELECT SUM(credit_balance) FROM users) AS total_credits,
  NOW() AS snapshot_time;

-- =============================================================================
-- SAVE THIS OUTPUT!
-- Compare with post_migration_validation.sql results to ensure data integrity
-- =============================================================================
