-- Migration 006: Add schema_score to schema_generations
-- Stores the calculated quality score for each generated schema

-- Add schema_score column to schema_generations table
ALTER TABLE schema_generations
ADD COLUMN schema_score JSONB;

-- Add index for querying by score
CREATE INDEX idx_schema_generations_score ON schema_generations((schema_score->>'overallScore'));

-- Add comment to document the column
COMMENT ON COLUMN schema_generations.schema_score IS 'Stores the quality assessment score for the generated schema including overall score, breakdown, strengths, and suggestions';
