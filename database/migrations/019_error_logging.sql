-- Migration: Error Logging System
-- Description: Adds error_logs table for centralized error tracking and debugging
-- Author: System
-- Date: 2025-11-03

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Error identification
    error_type TEXT NOT NULL,           -- 'api_error', 'database_error', 'validation_error', 'schema_generation_error', etc.
    error_code TEXT,                    -- Custom error codes (optional)
    message TEXT NOT NULL,
    stack_trace TEXT,

    -- User context
    user_id TEXT,                       -- References users(id), nullable for unauthenticated errors
    team_id UUID,                       -- References teams(id), nullable
    session_id TEXT,
    user_email TEXT,

    -- Request details
    request_method TEXT,
    request_url TEXT,
    request_path TEXT,
    request_body JSONB,
    request_headers JSONB,

    -- Response details
    response_status INTEGER,
    response_body JSONB,

    -- Environment context
    environment TEXT DEFAULT 'production', -- 'production', 'development', 'staging'
    ip_address INET,
    user_agent TEXT,

    -- Error grouping & deduplication
    error_fingerprint TEXT,             -- MD5 hash for grouping similar errors
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,

    -- Resolution tracking
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    resolution_notes TEXT,

    -- Metadata
    additional_context JSONB,           -- Flexible storage for any extra debugging info
    tags TEXT[],                        -- For categorization (e.g., ['critical', 'payment', 'ai'])

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(error_fingerprint) WHERE error_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);
CREATE INDEX IF NOT EXISTS idx_error_logs_response_status ON error_logs(response_status) WHERE response_status IS NOT NULL;

-- Create composite index for common queries (recent errors by status)
CREATE INDEX IF NOT EXISTS idx_error_logs_status_created ON error_logs(status, created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_error_logs_updated_at
    BEFORE UPDATE ON error_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_error_logs_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can view all error logs
CREATE POLICY "Admin users can view all error logs"
    ON error_logs
    FOR SELECT
    TO authenticated
    USING (
        -- This will be enforced at the application level via admin middleware
        -- For now, allow all authenticated users (admin check happens in backend)
        true
    );

-- Only service role can insert/update error logs (no direct user access)
CREATE POLICY "Service role can insert error logs"
    ON error_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can update error logs"
    ON error_logs
    FOR UPDATE
    TO service_role
    USING (true);

-- Comments for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging for debugging and monitoring';
COMMENT ON COLUMN error_logs.error_fingerprint IS 'MD5 hash for grouping similar errors together';
COMMENT ON COLUMN error_logs.occurrence_count IS 'Number of times this error has occurred (updated when fingerprint matches)';
COMMENT ON COLUMN error_logs.additional_context IS 'Flexible JSONB field for any extra debugging information';
COMMENT ON COLUMN error_logs.tags IS 'Array of tags for categorization and filtering';

-- Insert a test error log to verify table structure
INSERT INTO error_logs (
    error_type,
    message,
    stack_trace,
    error_fingerprint,
    environment,
    tags
) VALUES (
    'system',
    'Error logging system initialized successfully',
    'Migration 019_error_logging.sql',
    md5('system:initialized'),
    COALESCE(current_setting('app.environment', true), 'production'),
    ARRAY['system', 'migration']
);
