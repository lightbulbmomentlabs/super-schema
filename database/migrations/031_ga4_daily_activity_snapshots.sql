-- Migration: Create ga4_daily_activity_snapshots table
-- Purpose: Store daily AI crawler activity metrics for trend visualization
-- Date: 2025-11-22

CREATE TABLE IF NOT EXISTS ga4_daily_activity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES ga4_domain_mappings(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Core activity metrics (raw data that feeds into AI Visibility Score)
  ai_sessions INTEGER NOT NULL DEFAULT 0,
  unique_crawlers INTEGER NOT NULL DEFAULT 0,
  ai_crawled_pages INTEGER NOT NULL DEFAULT 0,
  total_active_pages INTEGER NOT NULL DEFAULT 0,

  -- Metadata for tracking and debugging
  crawler_list JSONB, -- Array of crawler names active on this day
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exclusion_patterns_hash TEXT, -- Hash of active patterns when calculated (for cache invalidation)

  -- Constraints
  UNIQUE(mapping_id, snapshot_date),
  CHECK (ai_sessions >= 0),
  CHECK (unique_crawlers >= 0),
  CHECK (ai_crawled_pages >= 0),
  CHECK (total_active_pages >= 0),
  CHECK (ai_crawled_pages <= total_active_pages)
);

-- Indexes for efficient querying
CREATE INDEX idx_ga4_snapshots_mapping_date ON ga4_daily_activity_snapshots(mapping_id, snapshot_date DESC);
CREATE INDEX idx_ga4_snapshots_calculated_at ON ga4_daily_activity_snapshots(calculated_at);

-- Comments for documentation
COMMENT ON TABLE ga4_daily_activity_snapshots IS 'Daily snapshots of AI crawler activity metrics for trend visualization';
COMMENT ON COLUMN ga4_daily_activity_snapshots.ai_sessions IS 'Total AI crawler sessions on this date';
COMMENT ON COLUMN ga4_daily_activity_snapshots.unique_crawlers IS 'Number of unique AI crawlers active on this date';
COMMENT ON COLUMN ga4_daily_activity_snapshots.ai_crawled_pages IS 'Number of unique pages crawled by AI on this date (after exclusions)';
COMMENT ON COLUMN ga4_daily_activity_snapshots.total_active_pages IS 'Total pages with any traffic on this date (after exclusions)';
COMMENT ON COLUMN ga4_daily_activity_snapshots.exclusion_patterns_hash IS 'Hash of exclusion patterns active when snapshot was calculated (for recalculation on filter changes)';
