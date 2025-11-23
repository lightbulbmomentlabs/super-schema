-- Migration: Private Beta Feature Management System
-- Description: Creates tables for feature flags, beta requests, user access, and notifications
-- PostgreSQL compatible version

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Features table: Master registry of all features in the application
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY DEFAULT ('feature_' || replace(uuid_generate_v4()::text, '-', '')),
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (e.g., 'ai-analytics')
  name TEXT NOT NULL, -- Display name (e.g., 'AI Analytics Dashboard')
  description TEXT, -- Feature description for preview pages
  status TEXT NOT NULL CHECK (status IN ('in_development', 'private_beta', 'beta', 'live')) DEFAULT 'in_development',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast status-based queries
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_slug ON features(slug);

-- Beta requests table: User requests for private beta access
CREATE TABLE IF NOT EXISTS beta_requests (
  id TEXT PRIMARY KEY DEFAULT ('beta_req_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_at TIMESTAMP, -- NULL if pending, set when granted
  granted_by_admin_id TEXT, -- Which admin granted access
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, feature_id) -- Prevent duplicate requests
);

-- Indexes for beta requests
CREATE INDEX IF NOT EXISTS idx_beta_requests_user_id ON beta_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_requests_feature_id ON beta_requests(feature_id);
CREATE INDEX IF NOT EXISTS idx_beta_requests_granted_at ON beta_requests(granted_at);
CREATE INDEX IF NOT EXISTS idx_beta_requests_pending ON beta_requests(granted_at) WHERE granted_at IS NULL;

-- User feature access table: Many-to-many relationship for granted access
CREATE TABLE IF NOT EXISTS user_feature_access (
  user_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT, -- Admin user ID who granted access
  PRIMARY KEY (user_id, feature_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Index for fast access checks
CREATE INDEX IF NOT EXISTS idx_user_feature_access_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_access_feature ON user_feature_access(feature_id);

-- User notifications table: In-app notification system
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('beta_access_granted', 'feature_announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  feature_id TEXT, -- Reference to feature if applicable
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE SET NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;

-- Function to update features.updated_at timestamp
CREATE OR REPLACE FUNCTION update_features_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update features.updated_at
DROP TRIGGER IF EXISTS update_features_timestamp ON features;
CREATE TRIGGER update_features_timestamp
BEFORE UPDATE ON features
FOR EACH ROW
EXECUTE FUNCTION update_features_timestamp();

-- Seed initial features (explicitly generate ID)
INSERT INTO features (id, slug, name, description, status) VALUES
  ('feature_' || replace(uuid_generate_v4()::text, '-', ''), 'ai-analytics', 'AI Analytics Dashboard', 'Track and analyze AI crawler activity across your domains with comprehensive visibility metrics, trend analysis, and per-page performance insights.', 'private_beta')
ON CONFLICT(slug) DO NOTHING;
