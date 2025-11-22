-- Migration: Add ignored_pages_count column to ga4_crawler_metrics
-- Description: Track how many pages were excluded by path filters
-- Date: 2025-11-21

-- Add the ignored_pages_count column to track filtered out pages
ALTER TABLE ga4_crawler_metrics
ADD COLUMN IF NOT EXISTS ignored_pages_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN ga4_crawler_metrics.ignored_pages_count IS 'Number of pages excluded by exclusion patterns and filters';

-- Migration complete
