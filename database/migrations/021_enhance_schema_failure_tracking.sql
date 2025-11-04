-- Migration 021: Enhance Schema Generation Failure Tracking
-- Adds detailed failure tracking fields to better understand and debug generation failures

-- Add failure tracking columns to schema_generations table
ALTER TABLE schema_generations
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS failure_stage TEXT,
ADD COLUMN IF NOT EXISTS ai_model_provider TEXT,
ADD COLUMN IF NOT EXISTS stack_trace TEXT,
ADD COLUMN IF NOT EXISTS request_context JSONB;

-- Add comments for documentation
COMMENT ON COLUMN schema_generations.failure_reason IS 'Categorized failure type: timeout, scraper_error, ai_error, validation_error, insufficient_content, network_error, rate_limit, unknown';
COMMENT ON COLUMN schema_generations.failure_stage IS 'Stage where failure occurred: scraping, ai_generation, validation, post_processing';
COMMENT ON COLUMN schema_generations.ai_model_provider IS 'AI model used for generation: claude-sonnet-4-20250514, openai-gpt-4, etc.';
COMMENT ON COLUMN schema_generations.stack_trace IS 'Full error stack trace for debugging';
COMMENT ON COLUMN schema_generations.request_context IS 'Additional request context: IP address, user agent, request options, etc.';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_schema_generations_failure_reason
ON schema_generations(failure_reason)
WHERE failure_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_schema_generations_status_created
ON schema_generations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_schema_generations_user_status
ON schema_generations(user_id, status, created_at DESC);

-- Create view for easy failure analysis
CREATE OR REPLACE VIEW schema_failure_summary AS
SELECT
    DATE_TRUNC('day', created_at) as failure_date,
    failure_reason,
    failure_stage,
    COUNT(*) as failure_count,
    COUNT(DISTINCT user_id) as affected_users,
    COUNT(DISTINCT url) as unique_urls
FROM schema_generations
WHERE status = 'failed'
GROUP BY DATE_TRUNC('day', created_at), failure_reason, failure_stage
ORDER BY failure_date DESC, failure_count DESC;

COMMENT ON VIEW schema_failure_summary IS 'Daily summary of schema generation failures for analytics';
