-- Add admin privileges support
-- This migration adds an is_admin column to the users table to support
-- database-backed admin privilege management

-- Add is_admin column to users table
ALTER TABLE users
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster admin lookups
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Backfill existing admins from environment variable defaults
-- These are the users currently hardcoded in ADMIN_USER_IDS
UPDATE users
SET is_admin = true
WHERE id IN (
  'user_33hfeOP0UYLcyLEkfcCdITEYY6W',
  'user_33Fdrdz4hyXRWshiOjEsVOGmbTv'
);

-- Add comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Indicates if the user has admin privileges. Admins have access to the admin dashboard and can manage other users.';
