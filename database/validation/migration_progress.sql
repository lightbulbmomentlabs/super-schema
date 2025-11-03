-- Migration Progress Monitoring
-- Run this query repeatedly DURING migration to monitor progress

SELECT '=== MIGRATION PROGRESS REPORT ===' AS section;

-- =============================================================================
-- TEAM CREATION PROGRESS
-- =============================================================================

SELECT
  'Team Creation Progress' AS metric,
  COUNT(*) FILTER (WHERE active_team_id IS NOT NULL) AS users_with_teams,
  COUNT(*) FILTER (WHERE active_team_id IS NULL) AS users_without_teams,
  COUNT(*) AS total_users,
  ROUND(
    (COUNT(*) FILTER (WHERE active_team_id IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC) * 100,
    2
  ) AS percent_complete
FROM users;

-- =============================================================================
-- RESOURCE BACKFILL PROGRESS
-- =============================================================================

SELECT
  'Schema Backfill Progress' AS metric,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS schemas_with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS schemas_without_team,
  COUNT(*) AS total_schemas,
  ROUND(
    (COUNT(*) FILTER (WHERE team_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS percent_complete
FROM schema_generations;

SELECT
  'URL Backfill Progress' AS metric,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS urls_with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS urls_without_team,
  COUNT(*) AS total_urls,
  ROUND(
    (COUNT(*) FILTER (WHERE team_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS percent_complete
FROM discovered_urls;

SELECT
  'Credit Transaction Backfill' AS metric,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS transactions_with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS transactions_without_team,
  COUNT(*) AS total_transactions,
  ROUND(
    (COUNT(*) FILTER (WHERE team_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS percent_complete
FROM credit_transactions;

SELECT
  'Domain Backfill Progress' AS metric,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS domains_with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS domains_without_team,
  COUNT(*) AS total_domains,
  ROUND(
    (COUNT(*) FILTER (WHERE team_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS percent_complete
FROM user_domains;

SELECT
  'HubSpot Backfill Progress' AS metric,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS hubspot_with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS hubspot_without_team,
  COUNT(*) AS total_hubspot,
  ROUND(
    (COUNT(*) FILTER (WHERE team_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS percent_complete
FROM hubspot_connections;

-- =============================================================================
-- TEAM MEMBERSHIP PROGRESS
-- =============================================================================

SELECT
  'Team Membership Progress' AS metric,
  (SELECT COUNT(*) FROM team_members) AS team_members_created,
  (SELECT COUNT(*) FROM users) AS total_users_expected,
  CASE
    WHEN (SELECT COUNT(*) FROM team_members) >= (SELECT COUNT(*) FROM users)
    THEN '✓ Complete'
    ELSE CONCAT(
      'In Progress: ',
      ROUND(
        ((SELECT COUNT(*) FROM team_members)::NUMERIC / (SELECT COUNT(*) FROM users)::NUMERIC) * 100,
        2
      ),
      '% complete'
    )
  END AS status;

-- =============================================================================
-- OVERALL MIGRATION STATUS
-- =============================================================================

SELECT
  'Overall Migration Status' AS section,
  CASE
    WHEN (
      -- All users have teams
      (SELECT COUNT(*) FROM users WHERE active_team_id IS NULL) = 0
      AND
      -- All resources backfilled
      (SELECT COUNT(*) FROM schema_generations WHERE team_id IS NULL) = 0
      AND
      (SELECT COUNT(*) FROM discovered_urls WHERE team_id IS NULL) = 0
      AND
      (SELECT COUNT(*) FROM credit_transactions WHERE team_id IS NULL) = 0
      AND
      (SELECT COUNT(*) FROM user_domains WHERE team_id IS NULL) = 0
      AND
      (SELECT COUNT(*) FROM hubspot_connections WHERE team_id IS NULL) = 0
    )
    THEN '✓ MIGRATION COMPLETE - Ready for validation'
    ELSE '⏳ IN PROGRESS - Migration still running'
  END AS migration_status,
  NOW() AS checked_at;

-- =============================================================================
-- QUICK STATUS INDICATORS
-- =============================================================================

-- Users needing team assignment
SELECT COUNT(*) AS users_pending_team_assignment
FROM users
WHERE active_team_id IS NULL;

-- Resources needing backfill
SELECT
  (SELECT COUNT(*) FROM schema_generations WHERE team_id IS NULL) AS schemas_pending,
  (SELECT COUNT(*) FROM discovered_urls WHERE team_id IS NULL) AS urls_pending,
  (SELECT COUNT(*) FROM credit_transactions WHERE team_id IS NULL) AS transactions_pending,
  (SELECT COUNT(*) FROM user_domains WHERE team_id IS NULL) AS domains_pending,
  (SELECT COUNT(*) FROM hubspot_connections WHERE team_id IS NULL) AS hubspot_pending;

-- =============================================================================
-- TIP: Run this query every 10-30 seconds during migration
-- Watch for progress counters to reach 0 and percent_complete to reach 100%
-- =============================================================================
