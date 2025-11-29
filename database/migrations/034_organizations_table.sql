-- Migration: 034_organizations_table.sql
-- Description: Create organizations table for schema.org-compliant publisher data
-- Date: 2024-11-28
--
-- This enables users to create multiple organizations with complete business info
-- (address, contact, social profiles) that auto-populates into generated schemas
-- based on domain matching.

-- =============================================================================
-- CREATE ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Core schema.org Organization properties
    name TEXT NOT NULL,
    url TEXT,
    logo_url TEXT,

    -- PostalAddress (schema.org PostalAddress type)
    street_address TEXT,
    address_locality TEXT,      -- city
    address_region TEXT,        -- state/province
    postal_code TEXT,
    address_country TEXT,

    -- Contact information
    telephone TEXT,
    email TEXT,

    -- Social profiles (schema.org sameAs property)
    -- Array of social profile URLs (Twitter, LinkedIn, Facebook, etc.)
    same_as JSONB DEFAULT '[]',

    -- Domain associations for auto-matching during schema generation
    -- Array of domain strings (e.g., ["acme.com", "*.acme.com", "shop.acme.io"])
    associated_domains JSONB DEFAULT '[]',

    -- Metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Fast lookup by team
CREATE INDEX IF NOT EXISTS idx_organizations_team_id ON organizations(team_id);

-- Fast domain matching (GIN index for JSONB containment queries)
CREATE INDEX IF NOT EXISTS idx_organizations_domains ON organizations USING GIN (associated_domains);

-- Fast lookup for default organization per team
CREATE INDEX IF NOT EXISTS idx_organizations_default ON organizations(team_id, is_default) WHERE is_default = true;

-- =============================================================================
-- CONSTRAINT: Only one default organization per team
-- =============================================================================

-- Use a partial unique index instead of EXCLUDE constraint for better compatibility
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_unique_default_per_team
ON organizations(team_id)
WHERE is_default = true;

-- =============================================================================
-- DOMAIN MATCHING FUNCTION
-- =============================================================================

-- Function to find organization for a given domain
-- Priority: 1. Exact match, 2. Wildcard subdomain match, 3. Default org
-- Note: p_team_id is TEXT to support Supabase client which sends UUIDs as strings
CREATE OR REPLACE FUNCTION find_organization_for_domain(
    p_team_id TEXT,
    p_domain TEXT
) RETURNS organizations AS $$
DECLARE
    result organizations;
    normalized_domain TEXT;
    domain_value TEXT;
    team_uuid UUID;
BEGIN
    -- Cast team_id text to UUID
    team_uuid := p_team_id::UUID;

    -- Normalize domain (remove www., lowercase)
    normalized_domain := lower(regexp_replace(p_domain, '^www\.', ''));

    -- 1. Try exact domain match using JSONB containment
    SELECT * INTO result
    FROM organizations
    WHERE team_id = team_uuid
      AND is_active = true
      AND associated_domains @> to_jsonb(normalized_domain)
    LIMIT 1;

    IF FOUND THEN
        RETURN result;
    END IF;

    -- 2. Try wildcard subdomain match (*.example.com matches blog.example.com)
    SELECT o.* INTO result
    FROM organizations o,
    LATERAL jsonb_array_elements_text(o.associated_domains) AS domain_value
    WHERE o.team_id = team_uuid
      AND o.is_active = true
      AND domain_value LIKE '*.%'
      AND normalized_domain LIKE '%' || substring(domain_value from 2)
    LIMIT 1;

    IF FOUND THEN
        RETURN result;
    END IF;

    -- 3. Fall back to default organization
    SELECT * INTO result
    FROM organizations
    WHERE team_id = team_uuid
      AND is_active = true
      AND is_default = true
    LIMIT 1;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTION: Set default organization
-- =============================================================================

-- Function to set an organization as default (ensures only one default per team)
CREATE OR REPLACE FUNCTION set_default_organization(
    p_org_id UUID,
    p_team_id UUID
) RETURNS void AS $$
BEGIN
    -- First, unset any existing default for this team
    UPDATE organizations
    SET is_default = false, updated_at = NOW()
    WHERE team_id = p_team_id AND is_default = true;

    -- Then set the new default
    UPDATE organizations
    SET is_default = true, updated_at = NOW()
    WHERE id = p_org_id AND team_id = p_team_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- =============================================================================
-- TRIGGER: Auto-set first organization as default
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_set_first_org_default()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Count existing organizations for this team
    SELECT COUNT(*) INTO existing_count
    FROM organizations
    WHERE team_id = NEW.team_id;

    -- If this is the first organization, make it default
    IF existing_count = 0 THEN
        NEW.is_default = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_set_first_org_default ON organizations;
CREATE TRIGGER trigger_auto_set_first_org_default
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_first_org_default();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
-- CRITICAL: auth.uid() returns UUID but user_id/owner_id columns are TEXT
-- Must cast auth.uid() to TEXT for proper comparison

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view organizations for teams they are members of
CREATE POLICY "Users can view team organizations"
ON organizations FOR SELECT
USING (
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()::TEXT
    )
);

-- Policy: Team owners can insert organizations
CREATE POLICY "Team owners can create organizations"
ON organizations FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT id FROM teams WHERE owner_id = auth.uid()::TEXT
    )
);

-- Policy: Team owners can update organizations
CREATE POLICY "Team owners can update organizations"
ON organizations FOR UPDATE
USING (
    team_id IN (
        SELECT id FROM teams WHERE owner_id = auth.uid()::TEXT
    )
);

-- Policy: Team owners can delete organizations
CREATE POLICY "Team owners can delete organizations"
ON organizations FOR DELETE
USING (
    team_id IN (
        SELECT id FROM teams WHERE owner_id = auth.uid()::TEXT
    )
);

-- =============================================================================
-- MIGRATE EXISTING ORGANIZATION NAMES
-- =============================================================================

-- Migrate existing organization_name from users table to organizations table
-- This creates an organization for each team owner who has organization_name set
INSERT INTO organizations (team_id, name, is_default, is_active, created_at, updated_at)
SELECT
    t.id as team_id,
    u.organization_name as name,
    true as is_default,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM teams t
JOIN users u ON t.owner_id = u.id
WHERE u.organization_name IS NOT NULL
  AND u.organization_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.team_id = t.id
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE organizations IS 'Schema.org Organization profiles for auto-populating publisher data in generated schemas';
COMMENT ON COLUMN organizations.name IS 'schema.org: name - Organization name (required)';
COMMENT ON COLUMN organizations.url IS 'schema.org: url - Primary website URL';
COMMENT ON COLUMN organizations.logo_url IS 'schema.org: logo - URL to organization logo image';
COMMENT ON COLUMN organizations.street_address IS 'schema.org: PostalAddress.streetAddress';
COMMENT ON COLUMN organizations.address_locality IS 'schema.org: PostalAddress.addressLocality (city)';
COMMENT ON COLUMN organizations.address_region IS 'schema.org: PostalAddress.addressRegion (state/province)';
COMMENT ON COLUMN organizations.postal_code IS 'schema.org: PostalAddress.postalCode';
COMMENT ON COLUMN organizations.address_country IS 'schema.org: PostalAddress.addressCountry';
COMMENT ON COLUMN organizations.telephone IS 'schema.org: telephone - Business phone number';
COMMENT ON COLUMN organizations.email IS 'schema.org: email - Business email address';
COMMENT ON COLUMN organizations.same_as IS 'schema.org: sameAs - Array of social profile URLs';
COMMENT ON COLUMN organizations.associated_domains IS 'Domains for auto-matching during schema generation. Supports wildcards like *.example.com';
COMMENT ON COLUMN organizations.is_default IS 'If true, this org is used when no domain match is found';
COMMENT ON FUNCTION find_organization_for_domain IS 'Find organization by domain with exact match, wildcard match, and default fallback';
COMMENT ON FUNCTION set_default_organization IS 'Set an organization as the default for a team (ensures only one default)';
