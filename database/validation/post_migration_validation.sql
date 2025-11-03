-- Post-Migration Validation Checks
-- Run these queries AFTER executing team migration to verify success

-- =============================================================================
-- 1. VERIFY ALL USERS HAVE TEAMS
-- =============================================================================

SELECT '=== TEAM ASSIGNMENT VALIDATION ===' AS check_section;

-- All users should have active_team_id set
SELECT COUNT(*) AS users_without_team
FROM users
WHERE active_team_id IS NULL;
-- EXPECTED: 0

-- All users should be members of their active team
SELECT COUNT(*) AS users_not_in_their_team
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.user_id = u.id AND tm.team_id = u.active_team_id
);
-- EXPECTED: 0

-- All users should be owners of exactly one team
SELECT COUNT(*) AS users_not_owning_a_team
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM teams t WHERE t.owner_id = u.id
);
-- EXPECTED: 0

-- =============================================================================
-- 2. VERIFY RESOURCE MIGRATION
-- =============================================================================

SELECT '=== RESOURCE MIGRATION VALIDATION ===' AS check_section;

-- All schema_generations should have team_id
SELECT COUNT(*) AS schemas_without_team
FROM schema_generations
WHERE team_id IS NULL;
-- EXPECTED: 0

-- All discovered_urls should have team_id
SELECT COUNT(*) AS urls_without_team
FROM discovered_urls
WHERE team_id IS NULL;
-- EXPECTED: 0

-- All credit_transactions should have team_id
SELECT COUNT(*) AS transactions_without_team
FROM credit_transactions
WHERE team_id IS NULL;
-- EXPECTED: 0

-- All user_domains should have team_id
SELECT COUNT(*) AS domains_without_team
FROM user_domains
WHERE team_id IS NULL;
-- EXPECTED: 0

-- All hubspot_connections should have team_id
SELECT COUNT(*) AS hubspot_without_team
FROM hubspot_connections
WHERE team_id IS NULL;
-- EXPECTED: 0

-- =============================================================================
-- 3. DATA INTEGRITY CHECKS
-- =============================================================================

SELECT '=== DATA INTEGRITY VALIDATION ===' AS check_section;

-- Verify team_id matches user's active_team_id
SELECT COUNT(*) AS mismatched_schema_teams
FROM schema_generations sg
JOIN users u ON u.id = sg.user_id
WHERE sg.team_id != u.active_team_id;
-- EXPECTED: 0

SELECT COUNT(*) AS mismatched_url_teams
FROM discovered_urls du
JOIN users u ON u.id = du.user_id
WHERE du.team_id != u.active_team_id;
-- EXPECTED: 0

-- Verify no orphaned team_members (team or user doesn't exist)
SELECT COUNT(*) AS orphaned_team_members
FROM team_members tm
WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = tm.team_id)
   OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = tm.user_id);
-- EXPECTED: 0

-- =============================================================================
-- 4. COUNT VALIDATION (Compare with pre-migration)
-- =============================================================================

SELECT '=== COUNT VALIDATION ===' AS check_section;

-- Total counts should match pre-migration baseline
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM teams) AS total_teams,
  (SELECT COUNT(*) FROM team_members) AS total_team_members,
  (SELECT COUNT(*) FROM schema_generations) AS total_schemas,
  (SELECT COUNT(*) FROM discovered_urls) AS total_urls,
  (SELECT COUNT(*) FROM credit_transactions) AS total_transactions;

-- Teams count should equal users count (team-of-one model)
SELECT
  (SELECT COUNT(*) FROM users) AS user_count,
  (SELECT COUNT(*) FROM teams) AS team_count,
  CASE
    WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM teams)
    THEN 'PASS: Team count matches user count'
    ELSE 'FAIL: Team count does NOT match user count'
  END AS validation_result;

-- Team members count should equal users count (each user is member of their team)
SELECT
  (SELECT COUNT(*) FROM users) AS user_count,
  (SELECT COUNT(*) FROM team_members) AS team_member_count,
  CASE
    WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM team_members)
    THEN 'PASS: Team member count matches user count'
    ELSE 'FAIL: Team member count does NOT match user count'
  END AS validation_result;

-- =============================================================================
-- 5. CREDIT BALANCE VERIFICATION
-- =============================================================================

SELECT '=== CREDIT BALANCE VALIDATION ===' AS check_section;

-- Credits on users table should still match (not moved yet)
SELECT SUM(credit_balance) AS total_user_credits FROM users;
-- COMPARE: Should match pre-migration total_credits

-- =============================================================================
-- 6. SAMPLE DATA VERIFICATION
-- =============================================================================

SELECT '=== SAMPLE DATA VERIFICATION ===' AS check_section;

-- Compare same 5 users from pre-migration
-- Verify they have teams assigned and resource counts unchanged
SELECT
  u.id,
  u.email,
  u.credit_balance,
  u.active_team_id,
  t.id AS team_id,
  (t.owner_id = u.id) AS is_owner,
  (SELECT COUNT(*) FROM schema_generations WHERE user_id = u.id) AS schema_count,
  (SELECT COUNT(*) FROM discovered_urls WHERE user_id = u.id) AS url_count,
  (SELECT COUNT(*) FROM credit_transactions WHERE user_id = u.id) AS transaction_count,
  (SELECT COUNT(*) FROM schema_generations WHERE team_id = u.active_team_id) AS team_schema_count
FROM users u
LEFT JOIN teams t ON t.id = u.active_team_id
ORDER BY u.created_at
LIMIT 5;

-- =============================================================================
-- 7. TEAM STRUCTURE VALIDATION
-- =============================================================================

SELECT '=== TEAM STRUCTURE VALIDATION ===' AS check_section;

-- All teams should have exactly 1 member (team-of-one initial state)
SELECT
  COUNT(*) AS teams_with_incorrect_member_count
FROM (
  SELECT
    t.id,
    COUNT(tm.id) AS member_count
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id
  GROUP BY t.id
  HAVING COUNT(tm.id) != 1
) subquery;
-- EXPECTED: 0

-- All teams should have their owner as a member
SELECT COUNT(*) AS teams_without_owner_as_member
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.team_id = t.id AND tm.user_id = t.owner_id
);
-- EXPECTED: 0

-- =============================================================================
-- 8. FINAL SUMMARY
-- =============================================================================

SELECT '=== POST-MIGRATION SUMMARY ===' AS check_section;

SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM teams) AS total_teams,
  (SELECT COUNT(*) FROM team_members) AS total_members,
  (SELECT COUNT(*) FROM schema_generations) AS total_schemas,
  (SELECT COUNT(*) FROM discovered_urls) AS total_urls,
  (SELECT SUM(credit_balance) FROM users) AS total_credits,
  NOW() AS validation_time;

-- =============================================================================
-- CRITICAL: ALL CHECKS ABOVE SHOULD PASS
-- If any validation fails, DO NOT PROCEED to next phase
-- Investigate and fix issues before enabling team features
-- =============================================================================
