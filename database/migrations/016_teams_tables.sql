-- Migration 016: Teams Tables
-- Creates core team tables for shared account feature
-- This is Phase 1 - Non-breaking additive changes only

-- =============================================================================
-- 1. CREATE TEAMS TABLE
-- =============================================================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast owner lookups
CREATE INDEX idx_teams_owner_id ON teams(owner_id);

-- =============================================================================
-- 2. CREATE TEAM_MEMBERS TABLE
-- =============================================================================

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id) -- Prevent duplicate memberships
);

-- Indexes for fast lookups
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- =============================================================================
-- 3. CREATE TEAM_INVITES TABLE
-- =============================================================================

CREATE TABLE team_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invite_token TEXT NOT NULL UNIQUE, -- Cryptographically secure token
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for fast token lookups and cleanup
CREATE INDEX idx_team_invites_invite_token ON team_invites(invite_token);
CREATE INDEX idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX idx_team_invites_expires_at ON team_invites(expires_at) WHERE used_at IS NULL;

-- =============================================================================
-- 4. ADD NULLABLE TEAM COLUMNS TO EXISTING TABLES
-- =============================================================================

-- Add active_team_id to users table
-- NULL initially, will be populated during migration
ALTER TABLE users ADD COLUMN active_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX idx_users_active_team_id ON users(active_team_id);

-- Add team_id to credit_transactions
-- NULL initially, will be backfilled during migration
ALTER TABLE credit_transactions ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX idx_credit_transactions_team_id ON credit_transactions(team_id);

-- Add team_id to schema_generations
-- NULL initially, will be backfilled during migration
ALTER TABLE schema_generations ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX idx_schema_generations_team_id ON schema_generations(team_id);

-- Add team_id to discovered_urls
-- NULL initially, will be backfilled during migration
ALTER TABLE discovered_urls ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX idx_discovered_urls_team_id ON discovered_urls(team_id);

-- Add team_id to user_domains
-- NULL initially, will be backfilled during migration
ALTER TABLE user_domains ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX idx_user_domains_team_id ON user_domains(team_id);

-- Add team_id to hubspot_connections
-- NULL initially, will be backfilled during migration
ALTER TABLE hubspot_connections ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
CREATE INDEX idx_hubspot_connections_team_id ON hubspot_connections(team_id);

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is team owner
CREATE OR REPLACE FUNCTION is_team_owner(check_user_id TEXT, check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams
        WHERE id = check_team_id AND owner_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(check_user_id TEXT, check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = check_team_id AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team member count
CREATE OR REPLACE FUNCTION get_team_member_count(check_team_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM team_members
        WHERE team_id = check_team_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. CONSTRAINTS & VALIDATIONS
-- =============================================================================

-- Add check to prevent team size > 10
CREATE OR REPLACE FUNCTION enforce_team_size_limit()
RETURNS TRIGGER AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM team_members
    WHERE team_id = NEW.team_id;

    IF member_count >= 10 THEN
        RAISE EXCEPTION 'Team has reached maximum size of 10 members';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_size_limit_trigger
BEFORE INSERT ON team_members
FOR EACH ROW
EXECUTE FUNCTION enforce_team_size_limit();

-- Ensure invite token expiration is in the future
CREATE OR REPLACE FUNCTION validate_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Invite expiration must be in the future';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invite_expiration_trigger
BEFORE INSERT ON team_invites
FOR EACH ROW
EXECUTE FUNCTION validate_invite_expiration();

-- =============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE teams IS 'Teams for shared account feature - team-of-one model where each user starts with their own team';
COMMENT ON TABLE team_members IS 'Members of teams - junction table for team membership';
COMMENT ON TABLE team_invites IS 'Invitation tokens for joining teams - 7 day expiration, single use';

COMMENT ON COLUMN users.active_team_id IS 'The team the user is currently operating within - NULL before migration';
COMMENT ON COLUMN credit_transactions.team_id IS 'Team associated with this transaction - NULL before migration, will be backfilled';
COMMENT ON COLUMN schema_generations.team_id IS 'Team that owns this schema - NULL before migration, will be backfilled';
COMMENT ON COLUMN discovered_urls.team_id IS 'Team that owns this URL - NULL before migration, will be backfilled';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- NOTE: This migration only creates tables and adds nullable columns
-- It does NOT populate data or change existing RLS policies
-- Data migration and RLS updates will happen in separate controlled phases
-- At this point, application should still work normally using user_id queries
