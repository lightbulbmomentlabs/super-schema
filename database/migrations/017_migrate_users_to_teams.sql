-- Migration 017: Migrate Existing Users to Teams
-- This script creates teams for all existing users and migrates their data
-- Run this AFTER 016_teams_tables.sql has been deployed and verified

-- IMPORTANT: This script is designed to be run as a background job
-- It processes users in batches to avoid locking and can be resumed if interrupted

-- =============================================================================
-- SAFETY CHECKS
-- =============================================================================

DO $$
BEGIN
    -- Verify teams table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        RAISE EXCEPTION 'Teams table does not exist. Run 016_teams_tables.sql first.';
    END IF;

    -- Verify team_members table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        RAISE EXCEPTION 'Team_members table does not exist. Run 016_teams_tables.sql first.';
    END IF;

    -- Check if migration already partially run
    IF EXISTS (SELECT 1 FROM users WHERE active_team_id IS NOT NULL LIMIT 1) THEN
        RAISE NOTICE 'WARNING: Some users already have teams assigned. This script will only process users without teams.';
    END IF;

    RAISE NOTICE 'Safety checks passed. Starting migration...';
END $$;

-- =============================================================================
-- STEP 1: CREATE TEAMS FOR ALL USERS
-- =============================================================================

DO $$
DECLARE
    user_record RECORD;
    new_team_id UUID;
    processed_count INTEGER := 0;
    total_users INTEGER;
BEGIN
    -- Get total user count for progress tracking
    SELECT COUNT(*) INTO total_users FROM users WHERE active_team_id IS NULL;
    RAISE NOTICE 'Creating teams for % users...', total_users;

    -- Process each user without a team
    FOR user_record IN
        SELECT id, email
        FROM users
        WHERE active_team_id IS NULL
        ORDER BY created_at ASC
    LOOP
        BEGIN
            -- Create team for this user
            INSERT INTO teams (owner_id, created_at, updated_at)
            VALUES (user_record.id, NOW(), NOW())
            RETURNING id INTO new_team_id;

            -- Add user as first member of their team
            INSERT INTO team_members (team_id, user_id, invited_at, joined_at)
            VALUES (new_team_id, user_record.id, NOW(), NOW());

            -- Update user's active_team_id
            UPDATE users
            SET active_team_id = new_team_id, updated_at = NOW()
            WHERE id = user_record.id;

            processed_count := processed_count + 1;

            -- Log progress every 100 users
            IF processed_count % 100 = 0 THEN
                RAISE NOTICE 'Progress: % / % users processed (%.1f%%)',
                    processed_count, total_users,
                    (processed_count::NUMERIC / total_users::NUMERIC) * 100;
            END IF;

            -- Small delay to prevent overwhelming the database (10ms)
            PERFORM pg_sleep(0.01);

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error processing user %: %', user_record.email, SQLERRM;
                -- Continue with next user
        END;
    END LOOP;

    RAISE NOTICE 'Team creation complete: % teams created', processed_count;

    -- Verification
    DECLARE
        users_without_teams INTEGER;
    BEGIN
        SELECT COUNT(*) INTO users_without_teams FROM users WHERE active_team_id IS NULL;
        IF users_without_teams > 0 THEN
            RAISE WARNING '% users still without teams. Check logs for errors.', users_without_teams;
        ELSE
            RAISE NOTICE '✓ All users successfully assigned to teams';
        END IF;
    END;
END $$;

-- =============================================================================
-- STEP 2: BACKFILL TEAM_ID ON CREDIT_TRANSACTIONS
-- =============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Backfilling credit_transactions with team_id...';

    LOOP
        -- Update in batches to avoid long locks
        UPDATE credit_transactions ct
        SET team_id = u.active_team_id
        FROM users u
        WHERE ct.user_id = u.id
          AND ct.team_id IS NULL
          AND u.active_team_id IS NOT NULL
          AND ct.id IN (
              SELECT ct2.id
              FROM credit_transactions ct2
              WHERE ct2.team_id IS NULL
              LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        total_updated := total_updated + rows_updated;

        EXIT WHEN rows_updated = 0;

        RAISE NOTICE 'Updated % credit_transactions (total: %)', rows_updated, total_updated;
        PERFORM pg_sleep(0.1); -- Brief pause between batches
    END LOOP;

    RAISE NOTICE '✓ Credit transactions backfill complete: % rows updated', total_updated;
END $$;

-- =============================================================================
-- STEP 3: BACKFILL TEAM_ID ON SCHEMA_GENERATIONS
-- =============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Backfilling schema_generations with team_id...';

    LOOP
        UPDATE schema_generations sg
        SET team_id = u.active_team_id
        FROM users u
        WHERE sg.user_id = u.id
          AND sg.team_id IS NULL
          AND u.active_team_id IS NOT NULL
          AND sg.id IN (
              SELECT sg2.id
              FROM schema_generations sg2
              WHERE sg2.team_id IS NULL
              LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        total_updated := total_updated + rows_updated;

        EXIT WHEN rows_updated = 0;

        RAISE NOTICE 'Updated % schema_generations (total: %)', rows_updated, total_updated;
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✓ Schema generations backfill complete: % rows updated', total_updated;
END $$;

-- =============================================================================
-- STEP 4: BACKFILL TEAM_ID ON DISCOVERED_URLS
-- =============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Backfilling discovered_urls with team_id...';

    LOOP
        UPDATE discovered_urls du
        SET team_id = u.active_team_id
        FROM users u
        WHERE du.user_id = u.id
          AND du.team_id IS NULL
          AND u.active_team_id IS NOT NULL
          AND du.id IN (
              SELECT du2.id
              FROM discovered_urls du2
              WHERE du2.team_id IS NULL
              LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        total_updated := total_updated + rows_updated;

        EXIT WHEN rows_updated = 0;

        RAISE NOTICE 'Updated % discovered_urls (total: %)', rows_updated, total_updated;
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✓ Discovered URLs backfill complete: % rows updated', total_updated;
END $$;

-- =============================================================================
-- STEP 5: BACKFILL TEAM_ID ON USER_DOMAINS
-- =============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Backfilling user_domains with team_id...';

    LOOP
        UPDATE user_domains ud
        SET team_id = u.active_team_id
        FROM users u
        WHERE ud.user_id = u.id
          AND ud.team_id IS NULL
          AND u.active_team_id IS NOT NULL
          AND ud.id IN (
              SELECT ud2.id
              FROM user_domains ud2
              WHERE ud2.team_id IS NULL
              LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        total_updated := total_updated + rows_updated;

        EXIT WHEN rows_updated = 0;

        RAISE NOTICE 'Updated % user_domains (total: %)', rows_updated, total_updated;
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✓ User domains backfill complete: % rows updated', total_updated;
END $$;

-- =============================================================================
-- STEP 6: BACKFILL TEAM_ID ON HUBSPOT_CONNECTIONS
-- =============================================================================

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Backfilling hubspot_connections with team_id...';

    LOOP
        UPDATE hubspot_connections hc
        SET team_id = u.active_team_id
        FROM users u
        WHERE hc.user_id = u.id
          AND hc.team_id IS NULL
          AND u.active_team_id IS NOT NULL
          AND hc.id IN (
              SELECT hc2.id
              FROM hubspot_connections hc2
              WHERE hc2.team_id IS NULL
              LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        total_updated := total_updated + rows_updated;

        EXIT WHEN rows_updated = 0;

        RAISE NOTICE 'Updated % hubspot_connections (total: %)', rows_updated, total_updated;
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✓ HubSpot connections backfill complete: % rows updated', total_updated;
END $$;

-- =============================================================================
-- FINAL VALIDATION
-- =============================================================================

DO $$
DECLARE
    users_without_teams INTEGER;
    schemas_without_teams INTEGER;
    urls_without_teams INTEGER;
    transactions_without_teams INTEGER;
    domains_without_teams INTEGER;
    hubspot_without_teams INTEGER;
    validation_failed BOOLEAN := false;
BEGIN
    RAISE NOTICE '=== RUNNING VALIDATION CHECKS ===';

    -- Check users
    SELECT COUNT(*) INTO users_without_teams FROM users WHERE active_team_id IS NULL;
    IF users_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % users without active_team_id', users_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All users have active_team_id';
    END IF;

    -- Check schema_generations
    SELECT COUNT(*) INTO schemas_without_teams FROM schema_generations WHERE team_id IS NULL;
    IF schemas_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % schema_generations without team_id', schemas_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All schema_generations have team_id';
    END IF;

    -- Check discovered_urls
    SELECT COUNT(*) INTO urls_without_teams FROM discovered_urls WHERE team_id IS NULL;
    IF urls_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % discovered_urls without team_id', urls_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All discovered_urls have team_id';
    END IF;

    -- Check credit_transactions
    SELECT COUNT(*) INTO transactions_without_teams FROM credit_transactions WHERE team_id IS NULL;
    IF transactions_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % credit_transactions without team_id', transactions_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All credit_transactions have team_id';
    END IF;

    -- Check user_domains
    SELECT COUNT(*) INTO domains_without_teams FROM user_domains WHERE team_id IS NULL;
    IF domains_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % user_domains without team_id', domains_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All user_domains have team_id';
    END IF;

    -- Check hubspot_connections
    SELECT COUNT(*) INTO hubspot_without_teams FROM hubspot_connections WHERE team_id IS NULL;
    IF hubspot_without_teams > 0 THEN
        RAISE WARNING 'VALIDATION FAILED: % hubspot_connections without team_id', hubspot_without_teams;
        validation_failed := true;
    ELSE
        RAISE NOTICE '✓ All hubspot_connections have team_id';
    END IF;

    -- Final verdict
    IF validation_failed THEN
        RAISE EXCEPTION 'MIGRATION VALIDATION FAILED - Review warnings above and re-run backfill steps';
    ELSE
        RAISE NOTICE '=================================';
        RAISE NOTICE '✓✓✓ MIGRATION SUCCESSFUL ✓✓✓';
        RAISE NOTICE '=================================';
        RAISE NOTICE 'All users migrated to teams';
        RAISE NOTICE 'All resources backfilled with team_id';
        RAISE NOTICE 'Ready to proceed with RLS policy updates';
    END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
