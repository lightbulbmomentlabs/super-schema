-- Migration 024: Enhance Pending HubSpot Connections
-- Adds analytics tracking for OAuth flow types and server-generated states
-- Fixes the root cause of marketplace-first OAuth callback failures

-- ============================================================================
-- 1. ADD ANALYTICS COLUMNS
-- ============================================================================

-- Track which OAuth flow initiated the connection
ALTER TABLE pending_hubspot_connections
ADD COLUMN IF NOT EXISTS oauth_flow_type TEXT
CHECK (oauth_flow_type IN ('superschema_first', 'marketplace_first'))
DEFAULT 'marketplace_first';

-- Track whether state was generated server-side or client-side
ALTER TABLE pending_hubspot_connections
ADD COLUMN IF NOT EXISTS server_generated_state BOOLEAN
DEFAULT FALSE;

-- Add comments explaining the new columns
COMMENT ON COLUMN pending_hubspot_connections.oauth_flow_type IS 'Tracks which OAuth flow was used: superschema_first (user initiated from SuperSchema) or marketplace_first (user initiated from HubSpot Marketplace)';
COMMENT ON COLUMN pending_hubspot_connections.server_generated_state IS 'TRUE if state was generated server-side for marketplace installs, FALSE if client provided state';

-- ============================================================================
-- 2. CREATE ADDITIONAL INDEXES FOR ANALYTICS AND CLEANUP
-- ============================================================================

-- Efficient cleanup queries by creation time
CREATE INDEX IF NOT EXISTS idx_pending_hubspot_created_at
ON pending_hubspot_connections(created_at)
WHERE claimed_at IS NULL;

-- Analytics: track flow type distribution
CREATE INDEX IF NOT EXISTS idx_pending_hubspot_flow_type
ON pending_hubspot_connections(oauth_flow_type);

-- ============================================================================
-- 3. UPDATE CLEANUP FUNCTION TO LOG ANALYTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_pending_hubspot_connections()
RETURNS TABLE (
    deleted_count INTEGER,
    superschema_first_count INTEGER,
    marketplace_first_count INTEGER,
    server_generated_count INTEGER
) AS $$
DECLARE
    v_deleted_count INTEGER;
    v_superschema_count INTEGER := 0;
    v_marketplace_count INTEGER := 0;
    v_server_generated_count INTEGER := 0;
BEGIN
    -- Count by flow type before deletion
    SELECT COUNT(*) INTO v_superschema_count
    FROM pending_hubspot_connections
    WHERE expires_at < NOW()
      AND claimed_at IS NULL
      AND oauth_flow_type = 'superschema_first';

    SELECT COUNT(*) INTO v_marketplace_count
    FROM pending_hubspot_connections
    WHERE expires_at < NOW()
      AND claimed_at IS NULL
      AND oauth_flow_type = 'marketplace_first';

    SELECT COUNT(*) INTO v_server_generated_count
    FROM pending_hubspot_connections
    WHERE expires_at < NOW()
      AND claimed_at IS NULL
      AND server_generated_state = TRUE;

    -- Delete expired, unclaimed connections
    DELETE FROM pending_hubspot_connections
    WHERE expires_at < NOW()
      AND claimed_at IS NULL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RAISE NOTICE 'Cleaned up % expired pending HubSpot connections (SuperSchema-first: %, Marketplace-first: %, Server-generated: %)',
        v_deleted_count, v_superschema_count, v_marketplace_count, v_server_generated_count;

    -- Return analytics
    RETURN QUERY SELECT
        v_deleted_count,
        v_superschema_count,
        v_marketplace_count,
        v_server_generated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_pending_hubspot_connections IS 'Remove expired pending HubSpot connections and return analytics. Should be run periodically (e.g., every 15 minutes via cron job).';

-- ============================================================================
-- 4. CREATE ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW pending_hubspot_analytics AS
SELECT
    oauth_flow_type,
    server_generated_state,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE claimed_at IS NOT NULL) as claimed_count,
    COUNT(*) FILTER (WHERE claimed_at IS NULL AND expires_at > NOW()) as active_count,
    COUNT(*) FILTER (WHERE claimed_at IS NULL AND expires_at < NOW()) as expired_count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(claimed_at, NOW()) - created_at))) as avg_time_to_claim_seconds
FROM pending_hubspot_connections
GROUP BY oauth_flow_type, server_generated_state;

COMMENT ON VIEW pending_hubspot_analytics IS 'Analytics dashboard for pending HubSpot connections, grouped by flow type and state generation method';

-- ============================================================================
-- ROLLBACK PROCEDURE (for emergency use)
-- ============================================================================

-- To rollback this migration:
-- DROP VIEW IF EXISTS pending_hubspot_analytics;
-- DROP INDEX IF EXISTS idx_pending_hubspot_flow_type;
-- DROP INDEX IF EXISTS idx_pending_hubspot_created_at;
-- ALTER TABLE pending_hubspot_connections DROP COLUMN IF EXISTS server_generated_state;
-- ALTER TABLE pending_hubspot_connections DROP COLUMN IF EXISTS oauth_flow_type;
-- -- Then restore the old cleanup function from migration 023

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Q: Why track oauth_flow_type?
-- A: To understand user behavior - are users finding us through HubSpot Marketplace
--    or through SuperSchema? This helps with marketing attribution and conversion analysis.

-- Q: Why track server_generated_state?
-- A: For security auditing - we want to know how often we're generating states server-side
--    vs receiving them from clients. Also helps validate the fix is working.

-- Q: Why the analytics view?
-- A: Provides a quick dashboard to monitor:
--    - How many connections are pending/claimed/expired
--    - Average time from creation to claim (user signup speed)
--    - Distribution across flow types

-- Q: Why update the cleanup function?
-- A: To log analytics when cleaning up, helping us understand which flow types
--    are most likely to be abandoned (user never completes signup).

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check columns exist:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pending_hubspot_connections'
-- AND column_name IN ('oauth_flow_type', 'server_generated_state');

-- View analytics:
-- SELECT * FROM pending_hubspot_analytics;

-- Test cleanup with analytics:
-- SELECT * FROM cleanup_expired_pending_hubspot_connections();
