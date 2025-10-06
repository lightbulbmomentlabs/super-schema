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