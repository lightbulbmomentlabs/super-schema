-- Migration: GA4 Path Exclusion Patterns
-- Description: Add support for filtering out edge-case URLs from AI Analytics
-- (auth pages, callbacks, static files, cross-domain paths, dynamic URLs)
-- Created: 2025-11-21

-- =====================================================
-- TABLE: ga4_excluded_path_patterns
-- =====================================================
-- Stores URL patterns to exclude from AI Analytics metrics
-- Supports default patterns (pre-populated) and user-custom patterns

CREATE TABLE IF NOT EXISTS ga4_excluded_path_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to domain mapping
  mapping_id UUID NOT NULL REFERENCES ga4_domain_mappings(id) ON DELETE CASCADE,

  -- Pattern matching configuration
  pattern TEXT NOT NULL,
  pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('exact', 'prefix', 'suffix', 'regex')),

  -- Categorization for better organization
  category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'callback', 'static', 'admin', 'api', 'custom')),
  description TEXT,

  -- Status and metadata
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL, -- Distinguishes pre-populated vs user-added

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by TEXT, -- user_id who added this pattern
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(mapping_id, pattern, pattern_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_ga4_exclusions_mapping ON ga4_excluded_path_patterns(mapping_id);
CREATE INDEX idx_ga4_exclusions_active ON ga4_excluded_path_patterns(is_active);
CREATE INDEX idx_ga4_exclusions_category ON ga4_excluded_path_patterns(category);
CREATE INDEX idx_ga4_exclusions_default ON ga4_excluded_path_patterns(is_default);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE ga4_excluded_path_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view exclusion patterns for their own domain mappings
CREATE POLICY "Users can view own exclusion patterns"
ON ga4_excluded_path_patterns FOR SELECT
USING (
  mapping_id IN (
    SELECT id FROM ga4_domain_mappings
    WHERE user_id = auth.uid()::text
  )
);

-- Policy: Users can insert exclusion patterns for their own domain mappings
CREATE POLICY "Users can insert own exclusion patterns"
ON ga4_excluded_path_patterns FOR INSERT
WITH CHECK (
  mapping_id IN (
    SELECT id FROM ga4_domain_mappings
    WHERE user_id = auth.uid()::text
  )
);

-- Policy: Users can update exclusion patterns for their own domain mappings
CREATE POLICY "Users can update own exclusion patterns"
ON ga4_excluded_path_patterns FOR UPDATE
USING (
  mapping_id IN (
    SELECT id FROM ga4_domain_mappings
    WHERE user_id = auth.uid()::text
  )
);

-- Policy: Users can delete exclusion patterns for their own domain mappings
CREATE POLICY "Users can delete own exclusion patterns"
ON ga4_excluded_path_patterns FOR DELETE
USING (
  mapping_id IN (
    SELECT id FROM ga4_domain_mappings
    WHERE user_id = auth.uid()::text
  )
);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_ga4_exclusion_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ga4_exclusion_patterns_timestamp
BEFORE UPDATE ON ga4_excluded_path_patterns
FOR EACH ROW
EXECUTE FUNCTION update_ga4_exclusion_patterns_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ga4_excluded_path_patterns IS 'URL patterns to exclude from AI Analytics metrics (auth pages, callbacks, static files, etc.)';
COMMENT ON COLUMN ga4_excluded_path_patterns.pattern IS 'The pattern to match against page paths (e.g., "/login*", "*.png", "/api/")';
COMMENT ON COLUMN ga4_excluded_path_patterns.pattern_type IS 'How to match the pattern: exact, prefix, suffix, or regex';
COMMENT ON COLUMN ga4_excluded_path_patterns.category IS 'Categorization: auth, callback, static, admin, api, or custom';
COMMENT ON COLUMN ga4_excluded_path_patterns.is_default IS 'True if this is a pre-populated default pattern, false if user-created';
COMMENT ON COLUMN ga4_excluded_path_patterns.is_active IS 'Whether this pattern is currently being applied to filtering';
