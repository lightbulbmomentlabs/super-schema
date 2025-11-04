-- Migration 022: Atomic Credit Consumption with Pessimistic Locking (v2 - Fixed)
-- Fixes race condition where multiple concurrent requests can cause negative credit balances
-- Implements FOR UPDATE NOWAIT to prevent TOCTOU (Time-Of-Check-Time-Of-Use) vulnerabilities

-- ============================================================================
-- 0. DROP ANY EXISTING CONFLICTING FUNCTIONS
-- ============================================================================

-- Drop all versions of refund_credits that might exist
DROP FUNCTION IF EXISTS refund_credits(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS refund_credits(TEXT, INTEGER);
DROP FUNCTION IF EXISTS refund_credits;

-- Drop any existing atomic version
DROP FUNCTION IF EXISTS consume_credits_atomic(TEXT, INTEGER, TEXT);

-- ============================================================================
-- 1. CREATE ATOMIC CREDIT CONSUMPTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_credits_atomic(
    p_user_id TEXT,
    p_amount INTEGER,
    p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- CRITICAL: Lock the user row FIRST using FOR UPDATE NOWAIT
    -- This prevents concurrent transactions from reading the same balance
    -- NOWAIT ensures we fail fast instead of waiting for locks
    SELECT credit_balance INTO current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE NOWAIT;

    -- If user not found, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Check AFTER locking (prevents race condition)
    IF current_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    -- Insert credit transaction record (negative amount for usage)
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'usage', -p_amount, p_description);

    -- Update user balance (row already locked, atomic with check above)
    UPDATE users
    SET credit_balance = credit_balance - p_amount,
        total_credits_used = total_credits_used + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;

EXCEPTION
    WHEN lock_not_available THEN
        -- NOWAIT triggered - another transaction is already processing this user's credits
        -- Return FALSE to indicate credit consumption failed (client should retry)
        RAISE NOTICE 'Credit lock not available for user %', p_user_id;
        RETURN FALSE;
    WHEN OTHERS THEN
        -- Any other error, re-raise it
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION consume_credits_atomic IS 'Atomically consume credits with pessimistic row-level locking. Prevents race conditions where concurrent requests could cause negative balances. Returns FALSE if insufficient credits or lock unavailable.';

-- ============================================================================
-- 2. CREATE REFUND CREDITS FUNCTION (with explicit parameter list)
-- ============================================================================

CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id TEXT,
    p_amount INTEGER,
    p_description TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Insert refund transaction record (positive amount)
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'refund', p_amount, p_description);

    -- Update user balance (add credits back)
    UPDATE users
    SET credit_balance = credit_balance + p_amount,
        total_credits_used = total_credits_used - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If user not found, transaction will still be recorded but balance won't update
    -- This is intentional - allows audit trail even if user is deleted

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refund_credits IS 'Refund credits to a user. Used when schema generation fails after credits were consumed. Creates audit trail in credit_transactions table.';

-- ============================================================================
-- 3. ROLLBACK PROCEDURE (for emergency use)
-- ============================================================================

-- To rollback this migration, simply drop the new functions:
-- DROP FUNCTION IF EXISTS consume_credits_atomic(TEXT, INTEGER, TEXT);
-- DROP FUNCTION IF EXISTS refund_credits(TEXT, INTEGER, TEXT);
-- The original consume_credits() function remains unchanged and will continue to work

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Q: Why not modify the existing consume_credits() function?
-- A: Backwards compatibility. Existing code can continue using old function during gradual rollout.

-- Q: What happens if two requests try to consume credits simultaneously?
-- A: First request acquires lock and proceeds. Second request gets lock_not_available exception
--    and returns FALSE immediately (no waiting). Client can retry.

-- Q: What's the performance impact?
-- A: Row-level locks are extremely fast (<1ms). FOR UPDATE NOWAIT prevents any waiting.

-- Q: What if generation takes 9+ minutes?
-- A: Credits are consumed BEFORE generation starts, so lock is released immediately.
--    The generation process does not hold any database locks.

-- Q: Can credits go negative?
-- A: No. The FOR UPDATE lock ensures balance check and deduction are atomic.
--    Impossible for two transactions to both see balance=1 and both deduct 1.

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test that functions exist:
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('consume_credits_atomic', 'refund_credits');

-- Test concurrent consumption (run in two separate psql sessions):
-- Session 1: BEGIN; SELECT consume_credits_atomic('user-id', 1, 'Test 1'); -- DO NOT COMMIT YET
-- Session 2: SELECT consume_credits_atomic('user-id', 1, 'Test 2'); -- Should return FALSE immediately

-- Verify refund works:
-- SELECT refund_credits('user-id', 1, 'Test refund');
