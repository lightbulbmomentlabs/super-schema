# 🚨 DEPLOY THIS DATABASE MIGRATION NOW

## What This Fixes
The `get_user_stats()` function has an "ambiguous column reference" error causing 500 errors when the dashboard loads.

## How to Deploy

1. **Go to Supabase SQL Editor**:
   https://supabase.com/dashboard/project/atopvinhrlicujtwltsg/sql/new

2. **Copy and paste this SQL** (or use the file `database/migrations/004_fix_get_user_stats.sql`):

```sql
-- Fix ambiguous column reference in get_user_stats function

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
```

3. **Click "Run"**

4. **Verify**: You should see "Success. No rows returned"

✅ Done! The 500 error on `/api/user/stats` should now be fixed.
