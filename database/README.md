# Database Setup Guide

This directory contains all database migrations and setup scripts for the AEO Schema Generator application.

## 📋 Quick Start

### Option 1: Deploy All at Once (Recommended)

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: `atopvinhrlicujtwltsg`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `deploy-all.sql`
6. Click **Run** (or press Ctrl/Cmd + Enter)

That's it! Your database is now set up with all tables, policies, functions, and seed data.

### Option 2: Deploy Step-by-Step

If you prefer to deploy migrations one at a time:

1. `migrations/001_initial_schema.sql` - Creates tables, types, indexes
2. `migrations/002_rls_policies.sql` - Sets up Row Level Security
3. `migrations/003_functions.sql` - Creates database functions
4. `seed/001_credit_packs.sql` - Adds credit pack data

Run each file in order through the Supabase SQL Editor.

## 📊 Database Schema Overview

### Tables

#### `users`
- Stores user profile data (extends Clerk authentication)
- Tracks credit balance and usage
- **Key Fields:** `id` (Clerk ID), `email`, `credit_balance`, `total_credits_used`

#### `credit_transactions`
- Records all credit purchases and usage
- **Types:** `purchase`, `usage`, `refund`, `bonus`
- Links to Stripe payment intents

#### `schema_generations`
- Stores schema generation results
- **Fields:** `url`, `schemas` (JSONB), `status`, `processing_time_ms`
- Tracks success/failure and error messages

#### `usage_analytics`
- Tracks user activity and events
- **Actions:** `schema_generation`, `schema_validation`, `credit_purchase`, `login`, `signup`
- Stores metadata, IP address, user agent

#### `credit_packs`
- Predefined credit packages for purchase
- **Default Packs:**
  - Starter: 20 credits - $9.99
  - Professional: 50 credits - $19.99 (20% savings)
  - Business: 100 credits - $34.99 (30% savings)
  - Agency: 250 credits - $74.99 (40% savings)
  - Enterprise: 500 credits - $124.99 (50% savings)

#### `payment_intents`
- Tracks Stripe payment status
- Links users to credit packs
- **Statuses:** `pending`, `succeeded`, `failed`, `canceled`

### Database Functions

#### `upsert_user_from_clerk()`
Creates or updates user from Clerk webhook
```sql
SELECT upsert_user_from_clerk(
  'user_123',
  'user@example.com',
  'John',
  'Doe'
);
```

#### `add_credits()`
Adds credits to user account (purchase, bonus, refund)
```sql
SELECT add_credits(
  'user_123',
  50,
  'Professional Pack purchase',
  'pi_stripe_payment_id'
);
```

#### `consume_credits()`
Deducts credits with validation (returns false if insufficient balance)
```sql
SELECT consume_credits(
  'user_123',
  1,
  'Schema generation for example.com'
);
```

#### `get_user_stats()`
Returns comprehensive user statistics
```sql
SELECT * FROM get_user_stats('user_123');
```

#### `track_usage()`
Logs user activity for analytics
```sql
SELECT track_usage(
  'user_123',
  'schema_generation',
  '{"url": "example.com", "schemas_count": 3}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
```

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Users:** Can view/update their own profile
- **Credit Transactions:** Users can view their own transactions
- **Schema Generations:** Users can view/insert their own generations
- **Usage Analytics:** Users can view their own analytics
- **Credit Packs:** Anyone can view active packs (read-only)
- **Payment Intents:** Users can view/insert their own payments
- **Service Role:** Has full access to all tables (for backend operations)

## ✅ Verification

After deployment, verify your setup:

```sql
-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify credit packs were seeded
SELECT * FROM credit_packs ORDER BY credits;

-- Test a function
SELECT * FROM get_user_stats('test_user_id');
```

## 🔧 Testing in Development

The application includes mock database mode for development without a database connection. This is automatically enabled when `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are not set.

To use the real database:
1. Ensure your `.env` file has the correct Supabase credentials
2. Restart your development server

## 📝 Environment Variables

Required in your `.env` file:

```bash
SUPABASE_URL=https://atopvinhrlicujtwltsg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔄 Updating the Schema

To add new migrations:

1. Create a new file: `migrations/004_your_migration.sql`
2. Add to the `deploy-all.sql` file
3. Run through Supabase SQL Editor

## 🚨 Rollback

If you need to reset the database:

```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS payment_intents CASCADE;
DROP TABLE IF EXISTS credit_packs CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP TABLE IF EXISTS schema_generations CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS analytics_action CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS schema_generation_status CASCADE;
DROP TYPE IF EXISTS credit_transaction_type CASCADE;
```

Then re-run `deploy-all.sql` to start fresh.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/plpgsql.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🐛 Troubleshooting

### Error: "relation already exists"
This is normal if running migrations multiple times. The `IF NOT EXISTS` clauses prevent errors.

### Error: "permission denied"
Ensure you're using the service role key, not the anon key, for migrations.

### Error: "type already exists"
The script handles this with exception blocks. It's safe to ignore.

### Functions not working
Check that the functions have `SECURITY DEFINER` - this allows them to bypass RLS.

## 💡 Best Practices

1. **Never run migrations in production without testing first**
2. **Always backup before major schema changes**
3. **Use transactions for complex migrations**
4. **Test RLS policies thoroughly**
5. **Monitor database performance with indexes**

---

**Last Updated:** 2025-10-03
**Schema Version:** 1.0.0
