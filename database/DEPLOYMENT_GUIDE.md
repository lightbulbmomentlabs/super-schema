# 🚀 Supabase Database Deployment Guide

## Quick Deployment Steps

### 1. Open Supabase Dashboard

Go to: https://app.supabase.com/project/atopvinhrlicujtwltsg

### 2. Navigate to SQL Editor

Click on **"SQL Editor"** in the left sidebar

### 3. Execute Deployment Script

1. Click **"New Query"**
2. Open the file `database/deploy-all.sql` in your code editor
3. Copy the entire contents
4. Paste into the Supabase SQL Editor
5. Click **"Run"** (or press `Ctrl/Cmd + Enter`)

### 4. Verify Deployment

Run the verification script:

```bash
node database/verify.js
```

Or manually check in Supabase Dashboard:
- Go to **Table Editor** → You should see 6 tables
- Go to **Database** → **Functions** → You should see 5 functions

---

## What Gets Created

### 📊 Tables (6)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles & credit tracking | Extends Clerk auth, tracks balance |
| `credit_transactions` | Credit history | Purchases, usage, refunds, bonuses |
| `schema_generations` | Generated schemas | URL, schemas (JSONB), timing, status |
| `usage_analytics` | User activity logs | Actions, metadata, IP, user agent |
| `credit_packs` | Available packages | Pre-seeded with 5 tiers |
| `payment_intents` | Stripe payments | Links users to purchases |

### 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Service role has full access for backend operations
- Credit packs are publicly readable

### ⚙️ Database Functions (5)

1. **`upsert_user_from_clerk()`** - Create/update users from Clerk webhooks
2. **`add_credits()`** - Add credits to user accounts
3. **`consume_credits()`** - Deduct credits with validation
4. **`get_user_stats()`** - Fetch comprehensive user statistics
5. **`track_usage()`** - Log analytics events

### 📦 Seed Data

5 credit packs automatically created:

| Pack | Credits | Price | Savings |
|------|---------|-------|---------|
| Starter | 20 | $9.99 | - |
| Professional ⭐ | 50 | $19.99 | 20% |
| Business | 100 | $34.99 | 30% |
| Agency | 250 | $74.99 | 40% |
| Enterprise | 500 | $124.99 | 50% |

---

## Environment Setup

Ensure your `.env` file has:

```bash
SUPABASE_URL=https://atopvinhrlicujtwltsg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

**⚠️ Important:** Use the **SERVICE_ROLE_KEY** for backend operations, not the ANON_KEY.

---

## Testing the Database

### Option 1: Automated Verification

```bash
node database/verify.js
```

This will:
- ✅ Check all tables exist
- ✅ Verify credit packs are seeded
- ✅ Test all database functions
- ✅ Create and clean up test data

### Option 2: Manual Testing in Supabase SQL Editor

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- View credit packs
SELECT * FROM credit_packs ORDER BY credits;

-- Test user creation
SELECT upsert_user_from_clerk(
  'test_user_123',
  'test@example.com',
  'Test',
  'User'
);

-- Check user was created with 2 free credits
SELECT * FROM users WHERE id = 'test_user_123';

-- Test adding credits
SELECT add_credits('test_user_123', 50, 'Test purchase');

-- Check updated balance
SELECT credit_balance FROM users WHERE id = 'test_user_123';

-- Test consuming credits
SELECT consume_credits('test_user_123', 1, 'Test schema generation');

-- Get user stats
SELECT * FROM get_user_stats('test_user_123');

-- Clean up
DELETE FROM users WHERE id = 'test_user_123';
```

---

## Application Integration

Once the database is deployed, your Node.js application will automatically use it:

### Current Behavior
- App runs in **mock mode** when Supabase credentials are missing
- Automatically switches to **real database** when credentials are present

### To Use Real Database
1. Deploy the database (steps above)
2. Ensure `.env` has correct Supabase credentials
3. Restart your dev servers:
   ```bash
   npm run dev
   ```

The `DatabaseService` in `server/src/services/database.ts` will detect the credentials and connect automatically.

---

## Monitoring & Maintenance

### View Database Activity
- **Dashboard** → **Reports** → Query performance
- **Dashboard** → **Database** → Connection pooling

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Credit Usage
```sql
SELECT
  COUNT(*) as total_users,
  SUM(credit_balance) as total_credits_available,
  SUM(total_credits_used) as total_credits_consumed,
  AVG(credit_balance) as avg_balance_per_user
FROM users
WHERE is_active = true;
```

### Track Schema Generations
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_time_ms
FROM schema_generations
GROUP BY status;
```

---

## Troubleshooting

### ❌ Error: "relation already exists"
**Solution:** This is normal if re-running migrations. The script uses `IF NOT EXISTS` to prevent errors.

### ❌ Error: "permission denied for table"
**Solution:** Ensure you're using the `SERVICE_ROLE_KEY`, not the `ANON_KEY`.

### ❌ Error: "function does not exist"
**Solution:** Run `migrations/003_functions.sql` or re-run `deploy-all.sql`.

### ❌ Mock Database Still Active
**Solution:**
1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Restart server: `npm run dev`
3. Check console logs for "Mock: ..." messages

### ❌ Credit Packs Not Showing
**Solution:** Run `seed/001_credit_packs.sql` or re-run `deploy-all.sql`.

---

## Rollback Instructions

If you need to completely reset the database:

```sql
-- ⚠️ WARNING: This deletes ALL data!

DROP TABLE IF EXISTS payment_intents CASCADE;
DROP TABLE IF EXISTS credit_packs CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP TABLE IF EXISTS schema_generations CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS upsert_user_from_clerk CASCADE;
DROP FUNCTION IF EXISTS add_credits CASCADE;
DROP FUNCTION IF EXISTS consume_credits CASCADE;
DROP FUNCTION IF EXISTS get_user_stats CASCADE;
DROP FUNCTION IF EXISTS track_usage CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

DROP TYPE IF EXISTS analytics_action CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS schema_generation_status CASCADE;
DROP TYPE IF EXISTS credit_transaction_type CASCADE;
```

Then re-run `deploy-all.sql`.

---

## Backup Strategy

### Manual Backup via Dashboard
1. Go to **Database** → **Backups**
2. Click **"Create Backup"**
3. Download backup if needed

### Scheduled Backups (Supabase Pro+)
- Automatic daily backups
- 7-day retention by default
- Point-in-time recovery available

---

## Next Steps After Deployment

1. ✅ **Verify deployment** - Run `node database/verify.js`
2. ✅ **Test application** - Restart servers and test real operations
3. ✅ **Monitor usage** - Check Supabase dashboard for activity
4. ⏭️ **Configure Clerk webhooks** - Set up user sync on signup
5. ⏭️ **Configure Stripe webhooks** - Set up payment processing
6. ⏭️ **Test credit flow** - Purchase credits, generate schemas
7. ⏭️ **Set up monitoring** - Add alerts for errors or high usage

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Dashboard:** https://app.supabase.com/project/atopvinhrlicujtwltsg
- **Project README:** `database/README.md`
- **Verification Script:** `database/verify.js`

---

**Status:** Ready for deployment 🚀
**Version:** 1.0.0
**Last Updated:** 2025-10-03
