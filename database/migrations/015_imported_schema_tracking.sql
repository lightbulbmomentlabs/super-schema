-- Migration 015: Add Imported Schema Tracking
-- Enables tracking of schemas imported from existing JSON-LD vs AI-generated schemas
-- Credit model: Imported schemas are free initially, first AI refinement costs 1 credit

-- Add is_imported_schema flag to distinguish imported vs generated schemas
ALTER TABLE schema_generations
ADD COLUMN is_imported_schema BOOLEAN NOT NULL DEFAULT false;

-- Add imported_at timestamp to track when schema was imported
ALTER TABLE schema_generations
ADD COLUMN imported_at TIMESTAMP WITH TIME ZONE;

-- Add has_been_refined flag to track if imported schema has been refined with AI
-- This enables the one-time credit charge for first refinement of imported schemas
ALTER TABLE schema_generations
ADD COLUMN has_been_refined BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient queries on imported schemas
CREATE INDEX IF NOT EXISTS idx_schema_generations_imported
ON schema_generations(user_id, is_imported_schema)
WHERE is_imported_schema = true;

-- Create index for refinement tracking
CREATE INDEX IF NOT EXISTS idx_schema_generations_refinement_tracking
ON schema_generations(is_imported_schema, has_been_refined);

-- Add comments for clarity
COMMENT ON COLUMN schema_generations.is_imported_schema IS 'True if schema was imported from existing JSON-LD, false if AI-generated';
COMMENT ON COLUMN schema_generations.imported_at IS 'Timestamp when schema was imported from existing JSON-LD (null for generated schemas)';
COMMENT ON COLUMN schema_generations.has_been_refined IS 'True if imported schema has been refined with AI at least once (for credit tracking)';
