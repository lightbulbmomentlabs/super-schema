-- Migration: Rename ai-analytics feature slug to ai-visibility
-- This updates the feature slug to match the new URL path

UPDATE features
SET slug = 'ai-visibility'
WHERE slug = 'ai-analytics';
