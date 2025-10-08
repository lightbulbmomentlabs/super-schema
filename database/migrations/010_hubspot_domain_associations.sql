-- Migration 010: HubSpot Domain Associations
-- Adds domain mapping to HubSpot connections for multi-portal support

-- Add associated_domains column to hubspot_connections
ALTER TABLE hubspot_connections
ADD COLUMN IF NOT EXISTS associated_domains TEXT[] DEFAULT '{}';

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_associated_domains
ON hubspot_connections USING GIN (associated_domains);

-- Function to find HubSpot connection by domain
CREATE OR REPLACE FUNCTION find_hubspot_connection_by_domain(
    p_user_id TEXT,
    p_domain TEXT
)
RETURNS TABLE (
    id UUID,
    portal_id TEXT,
    portal_name TEXT,
    scopes TEXT[],
    associated_domains TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hc.id,
        hc.hubspot_portal_id,
        hc.portal_name,
        hc.scopes,
        hc.associated_domains,
        hc.created_at
    FROM hubspot_connections hc
    WHERE hc.user_id = p_user_id
      AND hc.is_active = true
      AND p_domain = ANY(hc.associated_domains)
    ORDER BY hc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to add domain to HubSpot connection
CREATE OR REPLACE FUNCTION add_domain_to_hubspot_connection(
    p_connection_id UUID,
    p_domain TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE hubspot_connections
    SET associated_domains = array_append(associated_domains, p_domain),
        updated_at = NOW()
    WHERE id = p_connection_id
      AND NOT (p_domain = ANY(associated_domains));

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to remove domain from HubSpot connection
CREATE OR REPLACE FUNCTION remove_domain_from_hubspot_connection(
    p_connection_id UUID,
    p_domain TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE hubspot_connections
    SET associated_domains = array_remove(associated_domains, p_domain),
        updated_at = NOW()
    WHERE id = p_connection_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
