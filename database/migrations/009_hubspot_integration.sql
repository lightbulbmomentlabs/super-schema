-- Migration 009: HubSpot Integration
-- Enables HubSpot OAuth connections and schema sync tracking

-- Create hubspot_connections table
CREATE TABLE hubspot_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hubspot_portal_id TEXT NOT NULL,
    portal_name TEXT, -- Friendly name for display
    access_token TEXT NOT NULL, -- Encrypted OAuth access token
    refresh_token TEXT NOT NULL, -- Encrypted OAuth refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scopes TEXT[] NOT NULL, -- Array of granted OAuth scopes
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, hubspot_portal_id)
);

-- Create hubspot_sync_jobs table (track push operations)
CREATE TABLE hubspot_sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES hubspot_connections(id) ON DELETE CASCADE,
    schema_generation_id UUID REFERENCES schema_generations(id) ON DELETE SET NULL,
    hubspot_content_id TEXT NOT NULL, -- HubSpot blog post or page ID
    hubspot_content_type TEXT NOT NULL CHECK (hubspot_content_type IN ('blog_post', 'page', 'landing_page')),
    hubspot_content_title TEXT, -- For display purposes
    hubspot_content_url TEXT, -- The URL of the HubSpot content
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hubspot_connections_user_id ON hubspot_connections(user_id);
CREATE INDEX idx_hubspot_connections_is_active ON hubspot_connections(is_active);
CREATE INDEX idx_hubspot_connections_portal_id ON hubspot_connections(hubspot_portal_id);

CREATE INDEX idx_hubspot_sync_jobs_user_id ON hubspot_sync_jobs(user_id);
CREATE INDEX idx_hubspot_sync_jobs_connection_id ON hubspot_sync_jobs(connection_id);
CREATE INDEX idx_hubspot_sync_jobs_schema_id ON hubspot_sync_jobs(schema_generation_id);
CREATE INDEX idx_hubspot_sync_jobs_status ON hubspot_sync_jobs(status);
CREATE INDEX idx_hubspot_sync_jobs_created_at ON hubspot_sync_jobs(created_at);

-- Add updated_at trigger for hubspot_connections
CREATE TRIGGER update_hubspot_connections_updated_at BEFORE UPDATE ON hubspot_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active HubSpot connection for user
CREATE OR REPLACE FUNCTION get_active_hubspot_connection(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    portal_id TEXT,
    portal_name TEXT,
    scopes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hc.id,
        hc.hubspot_portal_id,
        hc.portal_name,
        hc.scopes,
        hc.created_at
    FROM hubspot_connections hc
    WHERE hc.user_id = p_user_id
      AND hc.is_active = true
    ORDER BY hc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get sync history for user
CREATE OR REPLACE FUNCTION get_hubspot_sync_history(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    hubspot_content_type TEXT,
    hubspot_content_title TEXT,
    hubspot_content_url TEXT,
    status TEXT,
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    portal_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hsj.id,
        hsj.hubspot_content_type,
        hsj.hubspot_content_title,
        hsj.hubspot_content_url,
        hsj.status,
        hsj.error_message,
        hsj.synced_at,
        hsj.created_at,
        hc.portal_name
    FROM hubspot_sync_jobs hsj
    JOIN hubspot_connections hc ON hsj.connection_id = hc.id
    WHERE hsj.user_id = p_user_id
    ORDER BY hsj.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
