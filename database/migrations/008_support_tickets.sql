-- Migration: Support Tickets System
-- Description: Creates support_tickets table for user support requests

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'feature_request', 'bug_report')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can create their own support tickets
CREATE POLICY support_tickets_insert_own
  ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can view their own support tickets
CREATE POLICY support_tickets_select_own
  ON support_tickets
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Admins can view all support tickets
-- Note: Admin check should be handled in application layer
-- This is a placeholder for future admin role implementation

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON support_tickets TO authenticated;
GRANT ALL ON support_tickets TO service_role;
