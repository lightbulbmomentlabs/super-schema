-- Migration: Add HubSpot Region Support
-- Description: Adds region column to hubspot_connections to support EU1 and AP1 regions
-- Author: System
-- Date: 2025-11-04

-- Add region column to hubspot_connections table
-- Defaults to 'na1' (North America) for backwards compatibility with existing connections
ALTER TABLE hubspot_connections
ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'na1'
CHECK (region IN ('na1', 'eu1', 'ap1'));

-- Add comment explaining the column
COMMENT ON COLUMN hubspot_connections.region IS 'HubSpot region: na1 (North America), eu1 (Europe), or ap1 (Asia Pacific). Determines which API endpoint to use.';

-- Backfill existing connections with 'na1' (already handled by DEFAULT, but explicit for clarity)
UPDATE hubspot_connections
SET region = 'na1'
WHERE region IS NULL;

-- Add index for potential region-based queries
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_region ON hubspot_connections(region);
