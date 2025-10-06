-- Migration 007: Add refinement_count to schema_generations
-- Tracks how many times a schema has been refined with AI

ALTER TABLE schema_generations
ADD COLUMN refinement_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN schema_generations.refinement_count IS 'Number of times this schema has been refined using AI';
