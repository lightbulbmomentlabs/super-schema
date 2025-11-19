-- Migration: GA4 AI Crawler Analytics
-- Description: Add tables for Google Analytics 4 integration to track AI crawler traffic
-- Date: 2025-11-18

-- =====================================================
-- Table: ga4_connections
-- Description: Stores encrypted OAuth credentials for GA4 access
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- OAuth Tokens (encrypted with AES-256-CBC like HubSpot)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,

  -- OAuth Metadata
  scopes TEXT[] DEFAULT '{}',

  -- Connection Status
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: One connection per user
  UNIQUE(user_id)
);

-- Indexes for ga4_connections
CREATE INDEX idx_ga4_connections_user ON ga4_connections(user_id);
CREATE INDEX idx_ga4_connections_team ON ga4_connections(team_id);
CREATE INDEX idx_ga4_connections_active ON ga4_connections(is_active);

-- =====================================================
-- Table: ga4_domain_mappings
-- Description: Maps GA4 properties to specific domains
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES ga4_connections(id) ON DELETE CASCADE,

  -- GA4 Property Info
  property_id TEXT NOT NULL,           -- GA4 Property ID (numeric, e.g., "123456789")
  property_name TEXT NOT NULL,         -- Display name from GA4

  -- Domain Mapping
  domain TEXT NOT NULL,                -- Domain to track (e.g., "example.com")

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: One mapping per domain per user
  UNIQUE(user_id, domain)
);

-- Indexes for ga4_domain_mappings
CREATE INDEX idx_ga4_mappings_user ON ga4_domain_mappings(user_id);
CREATE INDEX idx_ga4_mappings_team ON ga4_domain_mappings(team_id);
CREATE INDEX idx_ga4_mappings_connection ON ga4_domain_mappings(connection_id);
CREATE INDEX idx_ga4_mappings_domain ON ga4_domain_mappings(domain);
CREATE INDEX idx_ga4_mappings_property ON ga4_domain_mappings(property_id);

-- =====================================================
-- Table: ga4_crawler_metrics
-- Description: Cached AI crawler metrics to minimize GA4 API calls
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_crawler_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  mapping_id UUID NOT NULL REFERENCES ga4_domain_mappings(id) ON DELETE CASCADE,

  -- Domain Reference
  domain TEXT NOT NULL,

  -- Date Range for This Data
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,

  -- Core Metrics
  ai_visibility_score INTEGER CHECK (ai_visibility_score >= 0 AND ai_visibility_score <= 100),
  ai_diversity_score INTEGER,           -- Number of unique AI crawlers detected
  ai_crawler_list TEXT[] DEFAULT '{}',  -- List of crawler names (e.g., ['ChatGPT', 'Gemini'])
  coverage_percentage DECIMAL(5,2),     -- % of pages crawled by at least one AI
  total_pages INTEGER,                  -- Total pages in GA4 for domain
  ai_crawled_pages INTEGER,             -- Pages visited by AI crawlers

  -- Detailed Breakdown (JSONB for flexibility)
  top_crawlers JSONB,                   -- Array: [{name, sessions, pageViews}]
  top_pages JSONB,                      -- Array: [{path, crawlerCount, sessions}]
  crawler_details JSONB,                -- Detailed per-crawler stats

  -- Raw Data for Debugging
  raw_ga4_response JSONB,               -- Full GA4 API response (optional)

  -- Metadata
  refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: One metric set per mapping per date range
  UNIQUE(mapping_id, date_range_start, date_range_end)
);

-- Indexes for ga4_crawler_metrics
CREATE INDEX idx_ga4_metrics_user ON ga4_crawler_metrics(user_id);
CREATE INDEX idx_ga4_metrics_team ON ga4_crawler_metrics(team_id);
CREATE INDEX idx_ga4_metrics_mapping ON ga4_crawler_metrics(mapping_id);
CREATE INDEX idx_ga4_metrics_domain ON ga4_crawler_metrics(domain);
CREATE INDEX idx_ga4_metrics_refreshed ON ga4_crawler_metrics(refreshed_at);
CREATE INDEX idx_ga4_metrics_date_range ON ga4_crawler_metrics(date_range_start, date_range_end);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ga4_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_crawler_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: ga4_connections
-- =====================================================

-- Users can view their own connections
CREATE POLICY "Users can view own GA4 connections"
ON ga4_connections FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can create own GA4 connections"
ON ga4_connections FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own GA4 connections"
ON ga4_connections FOR UPDATE
USING (auth.uid()::text = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own GA4 connections"
ON ga4_connections FOR DELETE
USING (auth.uid()::text = user_id);

-- =====================================================
-- RLS Policies: ga4_domain_mappings
-- =====================================================

-- Users can view their own mappings
CREATE POLICY "Users can view own GA4 domain mappings"
ON ga4_domain_mappings FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create their own mappings
CREATE POLICY "Users can create own GA4 domain mappings"
ON ga4_domain_mappings FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own mappings
CREATE POLICY "Users can update own GA4 domain mappings"
ON ga4_domain_mappings FOR UPDATE
USING (auth.uid()::text = user_id);

-- Users can delete their own mappings
CREATE POLICY "Users can delete own GA4 domain mappings"
ON ga4_domain_mappings FOR DELETE
USING (auth.uid()::text = user_id);

-- =====================================================
-- RLS Policies: ga4_crawler_metrics
-- =====================================================

-- Users can view their own metrics
CREATE POLICY "Users can view own GA4 crawler metrics"
ON ga4_crawler_metrics FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can create their own metrics (via backend)
CREATE POLICY "Users can create own GA4 crawler metrics"
ON ga4_crawler_metrics FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own metrics
CREATE POLICY "Users can update own GA4 crawler metrics"
ON ga4_crawler_metrics FOR UPDATE
USING (auth.uid()::text = user_id);

-- Users can delete their own metrics
CREATE POLICY "Users can delete own GA4 crawler metrics"
ON ga4_crawler_metrics FOR DELETE
USING (auth.uid()::text = user_id);

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE ga4_connections IS 'Stores encrypted Google Analytics 4 OAuth credentials for accessing user GA4 data';
COMMENT ON TABLE ga4_domain_mappings IS 'Maps GA4 properties to specific domains for AI crawler tracking';
COMMENT ON TABLE ga4_crawler_metrics IS 'Cached AI crawler metrics from GA4 to minimize API calls and provide fast dashboard loading';

COMMENT ON COLUMN ga4_connections.access_token IS 'Encrypted OAuth access token (AES-256-CBC)';
COMMENT ON COLUMN ga4_connections.refresh_token IS 'Encrypted OAuth refresh token (AES-256-CBC)';
COMMENT ON COLUMN ga4_domain_mappings.property_id IS 'GA4 Property ID (numeric format, e.g., 123456789, NOT measurement ID)';
COMMENT ON COLUMN ga4_crawler_metrics.ai_visibility_score IS 'Combined score (0-100) based on AI diversity (50%) and coverage (50%)';
COMMENT ON COLUMN ga4_crawler_metrics.ai_diversity_score IS 'Number of unique AI crawlers detected (ChatGPT, Gemini, Perplexity, etc.)';
COMMENT ON COLUMN ga4_crawler_metrics.coverage_percentage IS 'Percentage of total pages that have been crawled by at least one AI';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next Steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify tables created successfully
-- 3. Set up Google Cloud OAuth credentials
-- 4. Add environment variables for GA4 integration
-- =====================================================
