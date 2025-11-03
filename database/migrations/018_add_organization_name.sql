-- Migration: Add organization_name to users table
-- This allows team owners to set their organization/company name
-- which will be displayed on team invite pages

-- Add organization_name column to users table
ALTER TABLE users ADD COLUMN organization_name TEXT;

-- Add index for performance when querying by organization name
CREATE INDEX idx_users_organization_name ON users(organization_name);

-- Add comment to document the column
COMMENT ON COLUMN users.organization_name IS 'Optional organization or company name for the user, displayed on team invites they create';
