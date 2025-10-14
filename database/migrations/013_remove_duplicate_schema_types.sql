-- Migration 013: Remove Duplicate Schema Types
-- Cleans up duplicate schema_type entries per URL
-- Keeps only the most recent schema for each (discovered_url_id, schema_type) combination

-- Step 1: Delete duplicate schema types, keeping only the most recent one
WITH ranked_schemas AS (
  SELECT
    id,
    discovered_url_id,
    schema_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY discovered_url_id, schema_type
      ORDER BY created_at DESC
    ) as rn
  FROM schema_generations
  WHERE discovered_url_id IS NOT NULL
)
DELETE FROM schema_generations
WHERE id IN (
  SELECT id
  FROM ranked_schemas
  WHERE rn > 1
);

-- Step 2: Log the results
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate schema type records', deleted_count;
END $$;

-- Step 3: Create unique constraint to prevent future duplicates
-- First drop the existing composite index if it exists
DROP INDEX IF EXISTS idx_schema_generations_url_type;

-- Create unique index instead of regular index
CREATE UNIQUE INDEX idx_schema_generations_url_type_unique
ON schema_generations(discovered_url_id, schema_type)
WHERE discovered_url_id IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_schema_generations_url_type_unique IS
  'Ensures each URL can only have one schema of each type. Prevents duplicate Article, FAQ, etc. schemas for the same URL.';
