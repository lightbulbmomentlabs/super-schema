-- Migration 023: Pending HubSpot Connections
-- Enables marketplace-first installation flow by storing OAuth codes temporarily
-- Allows users to install from HubSpot Marketplace before creating SuperSchema account

-- ============================================================================
-- 1. CREATE PENDING CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_hubspot_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- State token for CSRF protection and connection claiming
    state_token TEXT UNIQUE NOT NULL,

    -- OAuth code from HubSpot (short-lived, typically 30-60 seconds)
    oauth_code TEXT NOT NULL,

    -- HubSpot portal information
    hubspot_portal_id TEXT,  -- May not be available until token exchange
    portal_name TEXT,

    -- OAuth flow metadata
    redirect_uri TEXT NOT NULL,
    scopes TEXT[],

    -- Expiration and claiming
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_by_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE,

    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Fast lookup by state token (primary use case)
CREATE INDEX idx_pending_hubspot_state ON pending_hubspot_connections(state_token);

-- Cleanup expired entries
CREATE INDEX idx_pending_hubspot_expires ON pending_hubspot_connections(expires_at) WHERE claimed_at IS NULL;

-- Find unclaimed connections for a user (by portal ID after token exchange)
CREATE INDEX idx_pending_hubspot_portal ON pending_hubspot_connections(hubspot_portal_id) WHERE claimed_at IS NULL;

-- ============================================================================
-- 3. CREATE CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_pending_hubspot_connections()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired, unclaimed connections older than 30 minutes
    DELETE FROM pending_hubspot_connections
    WHERE expires_at < NOW()
      AND claimed_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Cleaned up % expired pending HubSpot connections', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_pending_hubspot_connections IS 'Remove expired pending HubSpot connections that were never claimed. Should be run periodically (e.g., hourly cron job).';

-- ============================================================================
-- 4. CREATE CLAIM FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_pending_hubspot_connection(
    p_state_token TEXT,
    p_user_id TEXT
)
RETURNS TABLE (
    oauth_code TEXT,
    redirect_uri TEXT,
    portal_id TEXT,
    portal_name TEXT
) AS $$
DECLARE
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Lock the pending connection row
    SELECT expires_at INTO v_expires_at
    FROM pending_hubspot_connections
    WHERE state_token = p_state_token
      AND claimed_at IS NULL
    FOR UPDATE NOWAIT;

    -- Check if found
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending connection not found or already claimed: %', p_state_token;
    END IF;

    -- Check if expired
    IF v_expires_at < NOW() THEN
        RAISE EXCEPTION 'Pending connection expired: %', p_state_token;
    END IF;

    -- Mark as claimed
    UPDATE pending_hubspot_connections
    SET claimed_by_user_id = p_user_id,
        claimed_at = NOW()
    WHERE state_token = p_state_token;

    -- Return connection details
    RETURN QUERY
    SELECT
        pc.oauth_code,
        pc.redirect_uri,
        pc.hubspot_portal_id,
        pc.portal_name
    FROM pending_hubspot_connections pc
    WHERE pc.state_token = p_state_token;

EXCEPTION
    WHEN lock_not_available THEN
        RAISE EXCEPTION 'Connection is being claimed by another request';
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_pending_hubspot_connection IS 'Atomically claim a pending HubSpot connection for a user. Returns connection details needed to complete OAuth flow.';

-- ============================================================================
-- ROLLBACK PROCEDURE (for emergency use)
-- ============================================================================

-- To rollback this migration:
-- DROP FUNCTION IF EXISTS claim_pending_hubspot_connection(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS cleanup_expired_pending_hubspot_connections();
-- DROP TABLE IF EXISTS pending_hubspot_connections;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Q: Why store OAuth codes in the database?
-- A: OAuth codes from HubSpot expire quickly (30-60 seconds). We need to exchange them
--    for tokens BEFORE the user completes signup. After signup, we use the stored tokens.

-- Q: What's the state_token for?
-- A: CSRF protection. Generated when OAuth is initiated, validated when claimed.
--    Also used to associate the pending connection with the user after signup.

-- Q: Why the 30-minute expiration?
-- A: OAuth codes expire in ~60 seconds, but we set 30 minutes to allow users time
--    to complete signup. If not claimed in 30 minutes, connection is garbage collected.

-- Q: What happens if user never completes signup?
-- A: The cleanup function removes expired pending connections periodically.
--    Run it via cron job: SELECT cleanup_expired_pending_hubspot_connections();

-- Q: Can the same state_token be claimed twice?
-- A: No. The UNIQUE constraint + claimed_at check + row-level locking prevent this.

-- Q: What if OAuth code expires before user completes signup?
-- A: The token exchange will fail when claimed. User will need to reconnect from HubSpot.
--    This is why we prioritize exchanging tokens BEFORE storing the pending connection.

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================

-- 1. User clicks "Install" from HubSpot Marketplace
-- 2. HubSpot redirects to /hubspot/callback?code=abc123
-- 3. Backend detects user not authenticated
-- 4. Exchange OAuth code for tokens IMMEDIATELY (before it expires)
-- 5. Store pending connection:
--    INSERT INTO pending_hubspot_connections (state_token, oauth_code, redirect_uri, expires_at)
--    VALUES ('secure-random-token', 'exchanged-tokens-json', 'https://superschema.ai/hubspot/callback', NOW() + INTERVAL '30 minutes');
-- 6. Redirect user to signup: /signup?pendingConnection=secure-random-token
-- 7. User completes signup
-- 8. Claim connection: SELECT * FROM claim_pending_hubspot_connection('secure-random-token', 'user-123');
-- 9. Store tokens in hubspot_connections table

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'pending_hubspot_connections';

-- Test cleanup function:
-- INSERT INTO pending_hubspot_connections (state_token, oauth_code, redirect_uri, expires_at)
-- VALUES ('test-token', 'test-code', 'http://localhost', NOW() - INTERVAL '1 hour');
-- SELECT cleanup_expired_pending_hubspot_connections();  -- Should delete 1

-- Test claim function:
-- INSERT INTO pending_hubspot_connections (state_token, oauth_code, redirect_uri, expires_at)
-- VALUES ('claim-test', 'test-code', 'http://localhost', NOW() + INTERVAL '30 minutes');
-- SELECT * FROM claim_pending_hubspot_connection('claim-test', 'test-user-id');
