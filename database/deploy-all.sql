-- ============================================================================
-- AEO Schema Generator - Complete Database Setup
-- ============================================================================
-- This file contains all migrations in the correct order
-- Execute this in the Supabase SQL Editor to set up your database
-- ============================================================================

-- ============================================================================
-- PART 1: Initial Schema (Tables, Types, Indexes, Triggers)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schema_generation_status AS ENUM ('success', 'failed', 'processing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE analytics_action AS ENUM ('schema_generation', 'schema_validation', 'credit_purchase', 'login', 'signup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    credit_balance INTEGER NOT NULL DEFAULT 2, -- Start with 2 free credits
    total_credits_used INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type credit_transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- Positive for additions, negative for usage
    description TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Schema generation results table
CREATE TABLE IF NOT EXISTS schema_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    schemas JSONB, -- Array of generated schemas
    status schema_generation_status NOT NULL DEFAULT 'processing',
    error_message TEXT,
    credits_cost INTEGER NOT NULL DEFAULT 1,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action analytics_action NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Credit packs table (predefined packages)
CREATE TABLE IF NOT EXISTS credit_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_in_cents INTEGER NOT NULL,
    savings INTEGER, -- Percentage savings
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Payment intents table
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_pack_id UUID NOT NULL REFERENCES credit_packs(id),
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    status payment_status NOT NULL DEFAULT 'pending',
    amount_in_cents INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

CREATE INDEX IF NOT EXISTS idx_schema_generations_user_id ON schema_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_schema_generations_created_at ON schema_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_schema_generations_status ON schema_generations(status);
CREATE INDEX IF NOT EXISTS idx_schema_generations_url ON schema_generations(url);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_action ON usage_analytics(action);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_intents_updated_at ON payment_intents;
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: Row Level Security Policies
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can manage all credit transactions" ON credit_transactions;

DROP POLICY IF EXISTS "Users can view their own schema generations" ON schema_generations;
DROP POLICY IF EXISTS "Users can insert their own schema generations" ON schema_generations;
DROP POLICY IF EXISTS "Service role can manage all schema generations" ON schema_generations;

DROP POLICY IF EXISTS "Users can view their own analytics" ON usage_analytics;
DROP POLICY IF EXISTS "Service role can manage all analytics" ON usage_analytics;

DROP POLICY IF EXISTS "Anyone can view active credit packs" ON credit_packs;
DROP POLICY IF EXISTS "Service role can manage all credit packs" ON credit_packs;

DROP POLICY IF EXISTS "Users can view their own payment intents" ON payment_intents;
DROP POLICY IF EXISTS "Users can insert their own payment intents" ON payment_intents;
DROP POLICY IF EXISTS "Service role can manage all payment intents" ON payment_intents;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Credit transactions policies
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all credit transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Schema generations policies
CREATE POLICY "Users can view their own schema generations" ON schema_generations
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own schema generations" ON schema_generations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all schema generations" ON schema_generations
    FOR ALL USING (auth.role() = 'service_role');

-- Usage analytics policies
CREATE POLICY "Users can view their own analytics" ON usage_analytics
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all analytics" ON usage_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Credit packs policies (read-only for users)
CREATE POLICY "Anyone can view active credit packs" ON credit_packs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage all credit packs" ON credit_packs
    FOR ALL USING (auth.role() = 'service_role');

-- Payment intents policies
CREATE POLICY "Users can view their own payment intents" ON payment_intents
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own payment intents" ON payment_intents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all payment intents" ON payment_intents
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 3: Database Functions
-- ============================================================================

-- Function to create or update user from Clerk webhook
CREATE OR REPLACE FUNCTION upsert_user_from_clerk(
    p_user_id TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO users (id, email, first_name, last_name)
    VALUES (p_user_id, p_email, p_first_name, p_last_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user account
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id TEXT,
    p_amount INTEGER,
    p_description TEXT,
    p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert credit transaction
    INSERT INTO credit_transactions (user_id, type, amount, description, stripe_payment_intent_id)
    VALUES (p_user_id, 'purchase', p_amount, p_description, p_stripe_payment_intent_id);

    -- Update user credit balance
    UPDATE users
    SET credit_balance = credit_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume credits (with validation)
CREATE OR REPLACE FUNCTION consume_credits(
    p_user_id TEXT,
    p_amount INTEGER,
    p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT credit_balance INTO current_balance
    FROM users WHERE id = p_user_id;

    -- Check if user has enough credits
    IF current_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    -- Insert credit transaction (negative amount for usage)
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'usage', -p_amount, p_description);

    -- Update user credit balance and usage count
    UPDATE users
    SET credit_balance = credit_balance - p_amount,
        total_credits_used = total_credits_used + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id TEXT)
RETURNS TABLE(
    credit_balance INTEGER,
    total_credits_used INTEGER,
    total_schemas_generated BIGINT,
    successful_generations BIGINT,
    failed_generations BIGINT,
    total_spent_cents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.credit_balance,
        u.total_credits_used,
        COALESCE(sg.total_schemas, 0) as total_schemas_generated,
        COALESCE(sg.successful_schemas, 0) as successful_generations,
        COALESCE(sg.failed_schemas, 0) as failed_generations,
        COALESCE(ct.total_spent, 0) as total_spent_cents
    FROM users u
    LEFT JOIN (
        SELECT
            sg.user_id,
            COUNT(*) as total_schemas,
            COUNT(*) FILTER (WHERE sg.status = 'success') as successful_schemas,
            COUNT(*) FILTER (WHERE sg.status = 'failed') as failed_schemas
        FROM schema_generations sg
        WHERE sg.user_id = p_user_id
        GROUP BY sg.user_id
    ) sg ON u.id = sg.user_id
    LEFT JOIN (
        SELECT
            ct.user_id,
            SUM(
                CASE
                    WHEN ct.type = 'purchase' THEN pi.amount_in_cents
                    ELSE 0
                END
            ) as total_spent
        FROM credit_transactions ct
        LEFT JOIN payment_intents pi ON ct.stripe_payment_intent_id = pi.stripe_payment_intent_id
        WHERE ct.user_id = p_user_id
        GROUP BY ct.user_id
    ) ct ON u.id = ct.user_id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track usage analytics
CREATE OR REPLACE FUNCTION track_usage(
    p_user_id TEXT,
    p_action analytics_action,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_analytics (user_id, action, metadata, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_metadata, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Seed Data (Credit Packs)
-- ============================================================================

-- Insert predefined credit packs (only if they don't exist)
INSERT INTO credit_packs (id, name, credits, price_in_cents, savings, is_popular, is_active)
SELECT * FROM (VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Starter Pack', 20, 999, NULL, false, true),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'Professional Pack', 50, 1999, 20, true, true),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'Business Pack', 100, 3499, 30, false, true),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'Agency Pack', 250, 7499, 40, false, true),
    ('a0000000-0000-0000-0000-000000000005'::uuid, 'Enterprise Pack', 500, 12499, 50, false, true)
) AS v(id, name, credits, price_in_cents, savings, is_popular, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM credit_packs WHERE id = v.id
);

-- ============================================================================
-- Deployment Complete!
-- ============================================================================

SELECT 'Database setup completed successfully! ✅' as status;
