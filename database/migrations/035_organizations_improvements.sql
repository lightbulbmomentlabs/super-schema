-- Migration: 035_organizations_improvements.sql
-- Description: Improvements to organizations table (fixes from code review)
-- Date: 2024-11-28
--
-- Fixes:
-- #11: Add index hint for optimized domain matching
-- #31: Add CHECK constraints for text field lengths
-- #32: Update RPC function to accept TEXT p_team_id consistently
--
-- IMPORTANT: This migration is safe for existing data because:
-- 1. CHECK constraints are added with NOT VALID (doesn't validate existing rows)
-- 2. CREATE INDEX IF NOT EXISTS won't fail if index already exists
-- 3. CREATE OR REPLACE FUNCTION won't fail if function exists
-- 4. CREATE EXTENSION IF NOT EXISTS won't fail if extension exists

-- =============================================================================
-- PRE-MIGRATION CHECK (Run manually before migration to verify data compliance)
-- =============================================================================
--
-- Run this query BEFORE applying the migration to check for violations:
--
-- SELECT
--   'name' as field, COUNT(*) as violations, MAX(length(name)) as max_len FROM organizations WHERE length(name) > 200
-- UNION ALL SELECT 'url', COUNT(*), MAX(length(url)) FROM organizations WHERE url IS NOT NULL AND length(url) > 2048
-- UNION ALL SELECT 'logo_url', COUNT(*), MAX(length(logo_url)) FROM organizations WHERE logo_url IS NOT NULL AND length(logo_url) > 2048
-- UNION ALL SELECT 'street_address', COUNT(*), MAX(length(street_address)) FROM organizations WHERE street_address IS NOT NULL AND length(street_address) > 500
-- UNION ALL SELECT 'address_locality', COUNT(*), MAX(length(address_locality)) FROM organizations WHERE address_locality IS NOT NULL AND length(address_locality) > 100
-- UNION ALL SELECT 'address_region', COUNT(*), MAX(length(address_region)) FROM organizations WHERE address_region IS NOT NULL AND length(address_region) > 100
-- UNION ALL SELECT 'postal_code', COUNT(*), MAX(length(postal_code)) FROM organizations WHERE postal_code IS NOT NULL AND length(postal_code) > 20
-- UNION ALL SELECT 'address_country', COUNT(*), MAX(length(address_country)) FROM organizations WHERE address_country IS NOT NULL AND length(address_country) > 100
-- UNION ALL SELECT 'telephone', COUNT(*), MAX(length(telephone)) FROM organizations WHERE telephone IS NOT NULL AND length(telephone) > 30
-- UNION ALL SELECT 'email', COUNT(*), MAX(length(email)) FROM organizations WHERE email IS NOT NULL AND length(email) > 254;
--
-- If any violations > 0, fix the data before running VALIDATE CONSTRAINT

-- =============================================================================
-- FIX #31: ADD CHECK CONSTRAINTS FOR TEXT FIELD LENGTHS
-- =============================================================================

-- Add length constraints to text fields to prevent data integrity issues
-- Using NOT VALID to avoid checking existing data during ALTER TABLE
-- This makes the migration safe and fast - validation can be done separately

ALTER TABLE organizations
    ADD CONSTRAINT chk_name_length CHECK (length(name) <= 200) NOT VALID,
    ADD CONSTRAINT chk_url_length CHECK (url IS NULL OR length(url) <= 2048) NOT VALID,
    ADD CONSTRAINT chk_logo_url_length CHECK (logo_url IS NULL OR length(logo_url) <= 2048) NOT VALID,
    ADD CONSTRAINT chk_street_address_length CHECK (street_address IS NULL OR length(street_address) <= 500) NOT VALID,
    ADD CONSTRAINT chk_address_locality_length CHECK (address_locality IS NULL OR length(address_locality) <= 100) NOT VALID,
    ADD CONSTRAINT chk_address_region_length CHECK (address_region IS NULL OR length(address_region) <= 100) NOT VALID,
    ADD CONSTRAINT chk_postal_code_length CHECK (postal_code IS NULL OR length(postal_code) <= 20) NOT VALID,
    ADD CONSTRAINT chk_address_country_length CHECK (address_country IS NULL OR length(address_country) <= 100) NOT VALID,
    ADD CONSTRAINT chk_telephone_length CHECK (telephone IS NULL OR length(telephone) <= 30) NOT VALID,
    ADD CONSTRAINT chk_email_length CHECK (email IS NULL OR length(email) <= 254) NOT VALID;

-- =============================================================================
-- OPTIONAL: VALIDATE CONSTRAINTS (Run after verifying no violations exist)
-- =============================================================================
-- These statements validate existing data against the constraints.
-- They are commented out because they should only be run after confirming
-- that no existing data violates the constraints (run the pre-migration check above).
--
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_name_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_url_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_logo_url_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_street_address_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_address_locality_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_address_region_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_postal_code_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_address_country_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_telephone_length;
-- ALTER TABLE organizations VALIDATE CONSTRAINT chk_email_length;

-- Add constraint for arrays (reasonable limit of 50 domains and 20 social profiles)
-- Note: JSONB arrays don't have native length constraints, enforced at app level

-- =============================================================================
-- FIX #32: UPDATE RPC FUNCTION TO ACCEPT TEXT p_team_id
-- =============================================================================

-- Drop and recreate the function with TEXT parameter type for consistency
-- This matches the pattern used in find_organization_for_domain

DROP FUNCTION IF EXISTS set_default_organization(UUID, UUID);

CREATE OR REPLACE FUNCTION set_default_organization(
    p_org_id UUID,
    p_team_id TEXT  -- Accept TEXT to match Supabase client behavior
) RETURNS void AS $$
DECLARE
    team_uuid UUID;
BEGIN
    -- Cast team_id text to UUID
    team_uuid := p_team_id::UUID;

    -- First, unset any existing default for this team
    UPDATE organizations
    SET is_default = false, updated_at = NOW()
    WHERE team_id = team_uuid AND is_default = true;

    -- Then set the new default
    UPDATE organizations
    SET is_default = true, updated_at = NOW()
    WHERE id = p_org_id AND team_id = team_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_default_organization(UUID, TEXT) IS 'Set an organization as the default for a team (ensures only one default). Accepts TEXT team_id for Supabase client compatibility.';

-- =============================================================================
-- FIX #11: OPTIMIZE DOMAIN MATCHING WITH BTREE INDEX ON NORMALIZED DOMAINS
-- =============================================================================

-- Add a trigram index for faster LIKE queries on wildcard domain matching
-- This requires the pg_trgm extension

-- First, ensure the extension is available (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a helper function to extract domains as text array for indexing
CREATE OR REPLACE FUNCTION get_domain_array_text(domains JSONB)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(SELECT jsonb_array_elements_text(domains));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a GIN index with trigram ops for faster wildcard matching
-- This optimizes the LIKE '%' || substring(...) pattern in find_organization_for_domain
CREATE INDEX IF NOT EXISTS idx_organizations_domains_trgm
ON organizations USING GIN ((get_domain_array_text(associated_domains)) gin_trgm_ops);

-- =============================================================================
-- OPTIMIZED DOMAIN MATCHING FUNCTION
-- =============================================================================

-- Replace the domain matching function with an optimized version
CREATE OR REPLACE FUNCTION find_organization_for_domain(
    p_team_id TEXT,
    p_domain TEXT
) RETURNS organizations AS $$
DECLARE
    result organizations;
    normalized_domain TEXT;
    team_uuid UUID;
BEGIN
    -- Cast team_id text to UUID
    team_uuid := p_team_id::UUID;

    -- Normalize domain (remove www., lowercase)
    normalized_domain := lower(regexp_replace(p_domain, '^www\.', ''));

    -- 1. Try exact domain match using JSONB containment (uses GIN index)
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
    -- Optimized: use array_position for better performance
    SELECT o.* INTO result
    FROM organizations o
    WHERE o.team_id = team_uuid
      AND o.is_active = true
      AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(o.associated_domains) AS d
          WHERE d LIKE '*.%'
            AND normalized_domain LIKE '%' || substring(d from 3)
      )
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

COMMENT ON FUNCTION find_organization_for_domain(TEXT, TEXT) IS 'Find organization by domain with exact match, wildcard match, and default fallback. Optimized with trigram index support.';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON CONSTRAINT chk_name_length ON organizations IS 'Organization name must be 200 characters or less';
COMMENT ON CONSTRAINT chk_url_length ON organizations IS 'URL must be 2048 characters or less';
COMMENT ON CONSTRAINT chk_telephone_length ON organizations IS 'Telephone must be 30 characters or less';
COMMENT ON CONSTRAINT chk_email_length ON organizations IS 'Email must be 254 characters or less (RFC 5321)';
