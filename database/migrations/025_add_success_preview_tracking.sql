-- Add Success Preview Tracking
-- This migration adds a has_seen_success_preview column to the users table
-- to track whether a user has seen the success preview interstitial after
-- their first schema generation (conversion optimization feature)

-- Add has_seen_success_preview column to users table
ALTER TABLE users
ADD COLUMN has_seen_success_preview BOOLEAN NOT NULL DEFAULT false;

-- Create index for analytics queries
CREATE INDEX idx_users_success_preview ON users(has_seen_success_preview);

-- Add comment for documentation
COMMENT ON COLUMN users.has_seen_success_preview IS 'Indicates if the user has seen the success preview interstitial after their first schema generation. Used for conversion rate optimization and A/B testing analytics.';
