-- Migration 006: Multi-Schema Per URL Support
-- Enables storing multiple schema types for a single URL
-- Credit model: 1 credit per URL (not per schema)

-- Add schema_type column to track which type of schema this is
-- Default to 'Auto' for backward compatibility with existing records
ALTER TABLE schema_generations
ADD COLUMN schema_type TEXT DEFAULT 'Auto';

-- Add deletion_count to track regeneration attempts per type
-- Allows 1 regeneration per schema type to prevent abuse
ALTER TABLE schema_generations
ADD COLUMN deletion_count INTEGER DEFAULT 0;

-- Add refinement_count if it doesn't exist (may already be added in previous migrations)
-- This tracks AI refinements per schema type (max 2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'schema_generations'
        AND column_name = 'refinement_count'
    ) THEN
        ALTER TABLE schema_generations
        ADD COLUMN refinement_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create composite index for efficient URL + type lookups
-- This enables fast queries like "get all schemas for URL X" and "get FAQ schema for URL X"
CREATE INDEX IF NOT EXISTS idx_schema_generations_url_type
ON schema_generations(discovered_url_id, schema_type);

-- Create index for deletion_count to support regeneration queries
CREATE INDEX IF NOT EXISTS idx_schema_generations_deletion_count
ON schema_generations(deletion_count);

-- Note: We keep the has_schema boolean flag in discovered_urls table
-- It remains TRUE if ANY schema type exists for that URL
-- The existing trigger (schema_generation_updates_url_status) already handles this

-- Comment for clarity
COMMENT ON COLUMN schema_generations.schema_type IS 'Type of schema: Auto, Article, FAQ, HowTo, Product, etc. Max 10 types per URL.';
COMMENT ON COLUMN schema_generations.deletion_count IS 'Number of times this schema type was deleted and regenerated. Max 1 regeneration allowed.';
COMMENT ON COLUMN schema_generations.refinement_count IS 'Number of AI refinements applied to this schema. Max 2 per schema type.';
