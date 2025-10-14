-- Migration 012: Fix Auto Schema Types
-- Updates all schema_type = 'Auto' records with actual detected types
-- Extracts the @type from stored schemas JSON

-- Create a temporary function to extract schema type from JSON
CREATE OR REPLACE FUNCTION extract_schema_type_from_json(schemas_json JSONB)
RETURNS TEXT AS $$
DECLARE
  schema_type TEXT;
  first_schema JSONB;
  type_value JSONB;
  schemas_array JSONB;
BEGIN
  -- Handle null input
  IF schemas_json IS NULL THEN
    RETURN 'Auto';
  END IF;

  -- Check if this is the nested structure {status, schemas, processingTimeMs}
  IF jsonb_typeof(schemas_json) = 'object' AND schemas_json ? 'schemas' THEN
    schemas_array := schemas_json->'schemas';
  ELSE
    schemas_array := schemas_json;
  END IF;

  -- Extract first schema from array
  IF jsonb_typeof(schemas_array) = 'array' AND jsonb_array_length(schemas_array) > 0 THEN
    first_schema := schemas_array->0;
  ELSE
    first_schema := schemas_array;
  END IF;

  -- Get the @type field
  type_value := first_schema->'@type';

  -- Handle @type as array or string
  IF jsonb_typeof(type_value) = 'array' THEN
    schema_type := type_value->>0;
  ELSIF jsonb_typeof(type_value) = 'string' THEN
    schema_type := type_value::text;
    schema_type := trim(both '"' from schema_type);
  ELSE
    RETURN 'Auto';
  END IF;

  -- Map Schema.org types to human-readable names
  CASE schema_type
    WHEN 'Article', 'NewsArticle', 'BlogPosting', 'ScholarlyArticle', 'TechArticle', 'Report' THEN
      RETURN 'Article';
    WHEN 'FAQPage' THEN
      RETURN 'FAQ';
    WHEN 'HowTo' THEN
      RETURN 'HowTo';
    WHEN 'Recipe' THEN
      RETURN 'Recipe';
    WHEN 'Product' THEN
      RETURN 'Product';
    WHEN 'Organization', 'Corporation' THEN
      RETURN 'Organization';
    WHEN 'LocalBusiness', 'Store', 'Restaurant' THEN
      RETURN 'Local Business';
    WHEN 'Event' THEN
      RETURN 'Event';
    WHEN 'Person' THEN
      RETURN 'Person';
    WHEN 'VideoObject' THEN
      RETURN 'Video';
    WHEN 'Course' THEN
      RETURN 'Course';
    WHEN 'JobPosting' THEN
      RETURN 'Job Posting';
    WHEN 'BreadcrumbList' THEN
      RETURN 'Breadcrumb';
    WHEN 'WebSite' THEN
      RETURN 'Website';
    WHEN 'WebPage' THEN
      RETURN 'Web Page';
    ELSE
      -- Return the original type if not in our mapping
      RETURN schema_type;
  END CASE;

EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return 'Auto'
    RETURN 'Auto';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all records where schema_type = 'Auto'
UPDATE schema_generations
SET schema_type = extract_schema_type_from_json(schemas)
WHERE schema_type = 'Auto'
  AND schemas IS NOT NULL;

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % schema_type records from Auto to detected types', updated_count;
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS extract_schema_type_from_json(JSONB);

-- Add comment
COMMENT ON COLUMN schema_generations.schema_type IS 'Detected schema type from generated JSON-LD (e.g., Article, FAQ, HowTo)';
