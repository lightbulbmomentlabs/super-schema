# Team Migration Rollback Procedures

This document provides step-by-step rollback procedures for the Team Shared Account feature at various stages of deployment.

## Table of Contents
1. [Immediate Rollback (Feature Flags)](#immediate-rollback)
2. [Partial Rollback (Data Intact)](#partial-rollback)
3. [Full Database Rollback](#full-database-rollback)
4. [Emergency Procedures](#emergency-procedures)

---

## Immediate Rollback (Feature Flags)

**Use Case**: Teams feature is live but causing issues. Need instant disable.

**Time to Execute**: < 30 seconds

**Data Impact**: NONE - All data remains intact

### Steps:

1. **Disable all team features immediately**:
   ```bash
   # Set environment variables on production server
   export ENABLE_TEAMS=false
   export ENABLE_TEAM_INVITES=false
   ```

2. **Restart application**:
   ```bash
   # If using PM2
   pm2 restart all

   # If using Docker
   docker restart <container-name>

   # If using systemd
   systemctl restart superschema
   ```

3. **Verify rollback**:
   - Visit application in browser
   - Confirm team sections are hidden
   - Verify users can still access their data
   - Check error logs for any issues

4. **Post-Rollback Actions**:
   - Notify team of rollback
   - Investigate root cause
   - Fix issues before re-enabling

**What Still Works After Rollback**:
- All user accounts
- All schema generation
- All credit operations
- All existing data accessible

**What Stops Working**:
- Team invite links (return 404)
- Team settings UI (hidden)
- Team member viewing

---

## Partial Rollback (Data Intact)

**Use Case**: Migration completed but need to revert to user_id-based queries

**Time to Execute**: 5-10 minutes

**Data Impact**: NONE - Team data preserved for future use

### Steps:

1. **Disable team features**:
   ```bash
   export ENABLE_TEAMS=false
   export ENABLE_TEAM_INVITES=false
   export TEAMS_MIGRATION_COMPLETE=false
   ```

2. **Deploy backward compatibility code**:
   - Application will use user_id queries as fallback
   - Team_id columns remain but aren't used
   - Restart application

3. **Verify application functionality**:
   ```sql
   -- Test queries still work
   SELECT * FROM schema_generations WHERE user_id = 'test-user-id';
   SELECT * FROM discovered_urls WHERE user_id = 'test-user-id';
   ```

4. **Monitor for issues**:
   - Check error rates
   - Verify users can access data
   - Confirm no data loss

**Advantages**:
- Quick rollback
- Data preserved
- Can re-enable later
- No data loss

**When to Use**:
- RLS policy issues
- Performance problems
- UI bugs
- Non-critical errors

---

## Full Database Rollback

**Use Case**: Migration caused data corruption or critical failure

**Time to Execute**: 30-60 minutes (depends on database size)

**Data Impact**: REVERTS to pre-migration state. Any new data created after migration will be lost.

### Prerequisites:
- Full database backup from before migration
- Downtime window scheduled
- Team notified
- Backup tested and verified

### Steps:

#### 1. Put Application in Maintenance Mode

```bash
# Stop the application
pm2 stop all
# OR
docker stop <container-name>
```

Create maintenance page or return 503 status.

#### 2. Backup Current State (Before Rollback)

Even though rolling back, backup current state for forensics:

```bash
# Using pg_dump
pg_dump -h localhost -U postgres -d superschema > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Using Supabase CLI (if applicable)
supabase db dump -f backup_before_rollback.sql
```

#### 3. Restore from Pre-Migration Backup

```bash
# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE superschema;"
psql -h localhost -U postgres -c "CREATE DATABASE superschema;"

# Restore from backup
psql -h localhost -U postgres -d superschema < pre_migration_backup.sql
```

**OR** using Supabase Dashboard:
1. Go to Database > Backups
2. Select pre-migration backup
3. Click "Restore"
4. Confirm restoration

#### 4. Verify Data Restoration

```sql
-- Run pre-migration checks again
\i database/validation/pre_migration_checks.sql

-- Verify counts match
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM schema_generations;
SELECT COUNT(*) FROM discovered_urls;
SELECT SUM(credit_balance) FROM users;
```

#### 5. Remove Team Migration Code

```bash
# Revert code to pre-migration commit
git revert <migration-commit-hash>
git push origin main

# OR checkout previous version
git checkout <pre-migration-tag>
```

#### 6. Deploy Pre-Migration Code

```bash
# Deploy previous version
npm run build
pm2 restart all
```

#### 7. Verify Application Works

- Test user login
- Test schema generation
- Test credit purchases
- Check all critical flows

#### 8. Exit Maintenance Mode

Re-enable application access once verified.

---

## Selective Table Rollback

**Use Case**: Only team tables need to be rolled back, keep user data changes

**Time to Execute**: 5 minutes

**Data Impact**: Team data deleted, user data preserved

### Steps:

1. **Drop team tables**:

```sql
-- Disable RLS first
ALTER TABLE team_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Drop team tables
DROP TABLE IF EXISTS team_invites CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Remove team_id columns
ALTER TABLE users DROP COLUMN IF EXISTS active_team_id;
ALTER TABLE credit_transactions DROP COLUMN IF EXISTS team_id;
ALTER TABLE schema_generations DROP COLUMN IF EXISTS team_id;
ALTER TABLE discovered_urls DROP COLUMN IF EXISTS team_id;
ALTER TABLE user_domains DROP COLUMN IF EXISTS team_id;
ALTER TABLE hubspot_connections DROP COLUMN IF EXISTS team_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_active_team_id;
DROP INDEX IF EXISTS idx_credit_transactions_team_id;
DROP INDEX IF EXISTS idx_schema_generations_team_id;
DROP INDEX IF EXISTS idx_discovered_urls_team_id;
DROP INDEX IF EXISTS idx_user_domains_team_id;
DROP INDEX IF EXISTS idx_hubspot_connections_team_id;
```

2. **Verify rollback**:

```sql
-- These queries should fail (tables don't exist)
SELECT * FROM teams; -- Should error

-- These queries should work
SELECT * FROM users;
SELECT * FROM schema_generations;
```

3. **Deploy pre-migration code and restart**

---

## Emergency Procedures

### Scenario 1: Database Locked / Migration Stuck

**Symptoms**: Migration script running for hours, database unresponsive

**Action**:

```sql
-- View active queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Kill long-running migration query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE query LIKE '%team_members%'
  AND state = 'active'
  AND now() - query_start > interval '5 minutes';
```

Then follow [Full Database Rollback](#full-database-rollback).

### Scenario 2: Data Corruption Detected

**Symptoms**: Users reporting missing data, inconsistent counts

**Action**:

1. **Immediately disable writes**:
   ```sql
   REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM PUBLIC;
   ```

2. **Put app in read-only mode**:
   ```bash
   export READ_ONLY_MODE=true
   pm2 restart all
   ```

3. **Run data integrity checks**:
   ```sql
   \i database/validation/post_migration_validation.sql
   ```

4. **If corruption confirmed**: Follow [Full Database Rollback](#full-database-rollback)

### Scenario 3: RLS Policies Blocking Access

**Symptoms**: Users getting 403 errors, "permission denied" errors

**Action**:

1. **Temporarily disable RLS** (emergency only):
   ```sql
   ALTER TABLE schema_generations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE discovered_urls DISABLE ROW LEVEL SECURITY;
   -- etc.
   ```

2. **Disable team features**:
   ```bash
   export ENABLE_TEAMS=false
   pm2 restart all
   ```

3. **Investigate RLS policies and fix**

4. **Re-enable RLS after fix**:
   ```sql
   ALTER TABLE schema_generations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE discovered_urls ENABLE ROW LEVEL SECURITY;
   ```

---

## Rollback Decision Tree

```
Issue Detected
    ├─ UI/UX Bug → Use Feature Flag Rollback (30 seconds)
    ├─ Performance Issue → Use Feature Flag Rollback (30 seconds)
    ├─ Data Access Issues → Use Partial Rollback (10 minutes)
    ├─ Data Corruption → Use Full Database Rollback (60 minutes)
    └─ Critical Production Outage → Emergency Procedures + Full Rollback
```

---

## Post-Rollback Checklist

After any rollback:

- [ ] Verify application is accessible
- [ ] Test user login
- [ ] Test schema generation
- [ ] Test credit purchases
- [ ] Check error logs
- [ ] Monitor metrics for 30 minutes
- [ ] Document root cause
- [ ] Create fix plan
- [ ] Schedule team postmortem

---

## Prevention Measures

To avoid needing rollbacks:

1. **Always test on staging first**
2. **Run all validation scripts before AND after migration**
3. **Monitor metrics continuously during rollout**
4. **Use gradual rollout** (beta users first)
5. **Keep backup retention for 30 days minimum**
6. **Have rollback plan ready before migration**

---

## Emergency Contacts

Keep this information updated:

- **Database Admin**: [Contact]
- **DevOps Lead**: [Contact]
- **Backup Location**: [Path/URL]
- **Supabase Support**: support@supabase.io
- **Digital Ocean Support**: [If applicable]

---

## Testing Rollback Procedures

**IMPORTANT**: Test these procedures on staging before production:

```bash
# 1. Create test database
createdb superschema_rollback_test

# 2. Load production data
pg_restore -d superschema_rollback_test production_backup.sql

# 3. Run migration
psql -d superschema_rollback_test -f database/migrations/016_teams.sql

# 4. Practice rollback
psql -d superschema_rollback_test -f database/rollback/rollback_teams.sql

# 5. Verify data intact
psql -d superschema_rollback_test -f database/validation/pre_migration_checks.sql
```

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Owner**: DevOps Team
