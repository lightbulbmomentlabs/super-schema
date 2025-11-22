-- Migration: Add non_crawled_pages column to ga4_crawler_metrics
-- Description: Store the list of pages that haven't been discovered by AI crawlers yet
-- Date: 2025-11-21

-- Add the non_crawled_pages column to store array of page paths
ALTER TABLE ga4_crawler_metrics
ADD COLUMN IF NOT EXISTS non_crawled_pages JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN ga4_crawler_metrics.non_crawled_pages IS 'Array of page paths that have not been discovered by any AI crawler yet';

-- Migration complete
