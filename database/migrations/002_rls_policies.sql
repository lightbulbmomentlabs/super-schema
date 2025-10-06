-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

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