-- Migration: Release Notes System
-- Description: Creates release_notes table for sharing product updates with users

-- Create release_notes table
CREATE TABLE IF NOT EXISTS release_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('new_feature', 'enhancement', 'performance', 'bug_fix')),
  release_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on release_date for fast chronological ordering
CREATE INDEX IF NOT EXISTS idx_release_notes_release_date ON release_notes(release_date DESC);

-- Create index on is_published for filtering published notes
CREATE INDEX IF NOT EXISTS idx_release_notes_is_published ON release_notes(is_published);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_release_notes_published_date ON release_notes(is_published, release_date DESC);

-- Enable Row Level Security
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: All authenticated users can view published release notes
CREATE POLICY release_notes_select_published
  ON release_notes
  FOR SELECT
  USING (is_published = true);

-- Policy: Service role (admins) can do everything
-- Note: Admin operations will use service_role, bypassing RLS

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_release_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_notes_updated_at
  BEFORE UPDATE ON release_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_release_notes_updated_at();

-- Grant permissions
GRANT SELECT ON release_notes TO authenticated;
GRANT ALL ON release_notes TO service_role;
