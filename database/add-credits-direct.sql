-- Add 102 credits to Kevin's Clerk account
-- Run this in Supabase SQL Editor

-- First, ensure the user exists (create if not)
INSERT INTO users (id, email, first_name, last_name, credit_balance, total_credits_used, is_active)
VALUES (
  'user_33Fdrdz4hyXRWshiOjEsVOGmbTv',
  'kevinfremon@gmail.com',
  'Kevin',
  'Fremon',
  2, -- Start with 2 free credits
  0,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Now add the testing credits
SELECT add_credits(
  'user_33Fdrdz4hyXRWshiOjEsVOGmbTv',
  100,
  'Testing credits for Kevin Fremon'
);

-- Show the final balance
SELECT
  id,
  email,
  first_name,
  last_name,
  credit_balance as "Current Balance",
  total_credits_used as "Total Used"
FROM users
WHERE id = 'user_33Fdrdz4hyXRWshiOjEsVOGmbTv';

-- Show recent transactions
SELECT
  type,
  amount,
  description,
  created_at
FROM credit_transactions
WHERE user_id = 'user_33Fdrdz4hyXRWshiOjEsVOGmbTv'
ORDER BY created_at DESC
LIMIT 5;

-- Clean up the old manual account
DELETE FROM users WHERE email = 'kevinfremon@gmail.com' AND id != 'user_33Fdrdz4hyXRWshiOjEsVOGmbTv';

SELECT 'Setup complete! Kevin now has 102 credits ready to use.' as status;
