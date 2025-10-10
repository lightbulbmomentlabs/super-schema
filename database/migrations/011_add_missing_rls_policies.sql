-- Migration 011: Add Missing RLS Policies
-- Adds Row Level Security policies for tables added after the initial RLS setup
-- This ensures defense-in-depth security and removes Supabase linter warnings

-- Enable Row Level Security on tables that were missing it
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_sync_jobs ENABLE ROW LEVEL SECURITY;

-- User domains policies
-- Users can only view their own domains
CREATE POLICY "Users can view their own domains" ON user_domains
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role has full access (used by backend)
CREATE POLICY "Service role can manage all domains" ON user_domains
    FOR ALL USING (auth.role() = 'service_role');

-- Discovered URLs policies
-- Users can only view their own discovered URLs
CREATE POLICY "Users can view their own URLs" ON discovered_urls
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role has full access (used by backend)
CREATE POLICY "Service role can manage all URLs" ON discovered_urls
    FOR ALL USING (auth.role() = 'service_role');

-- HubSpot connections policies
-- Users can only view their own HubSpot connections
CREATE POLICY "Users can view their own connections" ON hubspot_connections
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role has full access (used by backend)
CREATE POLICY "Service role can manage all connections" ON hubspot_connections
    FOR ALL USING (auth.role() = 'service_role');

-- HubSpot sync jobs policies
-- Users can only view their own sync jobs
CREATE POLICY "Users can view their own sync jobs" ON hubspot_sync_jobs
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role has full access (used by backend)
CREATE POLICY "Service role can manage all sync jobs" ON hubspot_sync_jobs
    FOR ALL USING (auth.role() = 'service_role');
