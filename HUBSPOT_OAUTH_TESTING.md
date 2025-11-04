# HubSpot OAuth Testing Guide

## Overview
This guide covers testing both HubSpot integration flows:
1. **SuperSchema-First Flow**: User creates SuperSchema account → connects HubSpot
2. **Marketplace-First Flow**: User installs from HubSpot Marketplace → creates account

## Prerequisites

### 1. Run Database Migration
The pending connections feature requires a new database table. Run this migration first:

```bash
# Open Supabase SQL Editor and run:
database/migrations/023_pending_hubspot_connections.sql
```

**What it does:**
- Creates `pending_hubspot_connections` table
- Adds `claim_pending_hubspot_connection()` function with row-level locking
- Adds `cleanup_expired_pending_hubspot_connections()` function
- Sets up proper indexes and foreign keys

### 2. Verify Environment Variables
Ensure these are set in your `.env` files:

**Client** (`client/.env`):
```
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
```

**Server** (`server/.env`):
```
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:5173/hubspot/callback
ENCRYPTION_KEY=your_32_byte_encryption_key
```

### 3. Start Development Servers
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Test Flow 1: SuperSchema-First (Authenticated User)

### Steps:
1. **Create Account**
   - Navigate to http://localhost:5173
   - Click "Sign Up" or "Get Started"
   - Complete Clerk signup flow
   - You should land on dashboard/welcome page

2. **Navigate to HubSpot Settings**
   - Go to Settings → HubSpot or directly to http://localhost:5173/hubspot
   - You should see "Connect HubSpot Account" button

3. **Initiate OAuth**
   - Click "Connect HubSpot Account"
   - Browser should redirect to `app.hubspot.com/oauth/authorize`
   - **Check:** URL should contain `state` parameter
   - **Check:** Console should show state parameter being generated and stored

4. **Authorize in HubSpot**
   - Select a HubSpot account/portal to connect
   - Click "Connect app"
   - Browser should redirect to `/hubspot/callback`

5. **Verify Callback**
   - Should see "Connecting to HubSpot..." loading state
   - **Check Console Logs:**
     - `🔄 [HubSpotCallback] Starting callback handler`
     - `🎯 [HubSpotCallback] Flow 1: SuperSchema-first (authenticated)`
     - `🔑 [HubSpotCallback] Getting auth token`
     - `✅ [HubSpotCallback] Got auth token`
     - `🔄 [HubSpotCallback] Exchanging code for tokens (authenticated flow)`
     - `✅ [HubSpotCallback] Connection successful`
   - Should show "Successfully Connected!" screen
   - Should auto-redirect to `/hubspot` after 2 seconds

6. **Verify Connection**
   - On HubSpot settings page, should see connected account
   - **Check Database:**
     ```sql
     SELECT * FROM hubspot_connections WHERE user_id = 'your_user_id';
     ```
   - Should have entry with encrypted tokens, portal info, scopes

### Expected Results:
✅ OAuth flow completes successfully
✅ Connection stored in `hubspot_connections` table
✅ NO entry in `pending_hubspot_connections` table
✅ Success toast notification appears
✅ User redirected to HubSpot settings page

## Test Flow 2: Marketplace-First (Unauthenticated User)

### Steps:
1. **Start Fresh**
   - Open incognito/private browser window
   - Clear all cookies/session storage
   - Sign out of SuperSchema if logged in

2. **Simulate Marketplace Installation**
   Since you don't have marketplace listing yet, simulate by manually navigating to OAuth URL:

   ```
   https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5173/hubspot/callback&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20content%20oauth
   ```

   Replace `YOUR_CLIENT_ID` with your actual HubSpot client ID.

3. **Authorize in HubSpot**
   - Select a HubSpot account/portal (use different one than Flow 1 if possible)
   - Click "Connect app"
   - Browser should redirect to `/hubspot/callback`

4. **Verify Callback (Unauthenticated)**
   - Should see "Connecting to HubSpot..." loading state
   - **Check Console Logs:**
     - `🔄 [HubSpotCallback] Starting callback handler`
     - `🎯 [HubSpotCallback] Flow 2: Marketplace-first (unauthenticated)`
     - `🔄 [HubSpotCallback] Exchanging code for tokens (unauthenticated flow)`
     - `✅ [HubSpotCallback] Pending connection created`
   - Should show "HubSpot Connected!" screen with message:
     > "Your HubSpot account is ready. Please create a SuperSchema account to continue."
   - Should auto-redirect to `/sign-up?pendingConnection={state}` after 2 seconds

5. **Complete Signup**
   - Should land on signup page with `pendingConnection` parameter in URL
   - Complete Clerk signup flow (use NEW email address)
   - After signup completes, should be redirected to welcome/dashboard

6. **Verify Auto-Claim**
   - **Check Console Logs:**
     - `🔄 [usePendingHubSpotConnection] Attempting to claim pending connection`
     - `✅ [usePendingHubSpotConnection] Successfully claimed connection`
   - Success toast should appear:
     > "HubSpot account {portal_name} connected successfully!"
   - URL should change (pendingConnection parameter removed)

7. **Verify Connection**
   - Navigate to Settings → HubSpot
   - Should see connected HubSpot account
   - **Check Database:**
     ```sql
     -- Should have entry in hubspot_connections
     SELECT * FROM hubspot_connections WHERE user_id = 'new_user_id';

     -- Pending connection should be marked as claimed
     SELECT * FROM pending_hubspot_connections
     WHERE state_token = 'the_state_token';
     ```
   - `claimed_at` should be populated
   - `claimed_by_user_id` should match new user

### Expected Results:
✅ OAuth code exchanged immediately (before signup)
✅ Pending connection created in database with encrypted tokens
✅ User redirected to signup with state parameter
✅ After signup, connection automatically claimed
✅ Connection moved to `hubspot_connections` table
✅ Pending connection marked as claimed
✅ Success toast notification appears

## Test Error Scenarios

### 1. Expired Pending Connection
**Steps:**
1. Follow Marketplace-First flow steps 1-4
2. Note the `pendingConnection` parameter value
3. Wait 31+ minutes (or manually update `expires_at` in database)
4. Try to complete signup with expired state parameter

**Expected Result:**
❌ Error toast: "HubSpot connection expired. Please reconnect from HubSpot."
❌ pendingConnection parameter removed from URL

### 2. Invalid State Parameter
**Steps:**
1. Manually navigate to: `/sign-up?pendingConnection=invalid_token_12345`
2. Complete signup

**Expected Result:**
❌ Error toast: "Failed to connect HubSpot account. Please try connecting again."
❌ pendingConnection parameter removed from URL

### 3. Already Claimed Connection
**Steps:**
1. Complete Marketplace-First flow once successfully
2. Try using the same pendingConnection parameter again with a different account

**Expected Result:**
❌ Error toast: "HubSpot connection expired. Please reconnect from HubSpot."
❌ Database function returns error (connection already claimed)

### 4. Network/Server Error During Claim
**Steps:**
1. Follow Marketplace-First flow through step 4
2. Stop the server before completing signup
3. Complete signup

**Expected Result:**
❌ Error toast: "Failed to connect HubSpot account. Please try connecting again."
❌ pendingConnection parameter removed from URL
✅ User can still use SuperSchema (connection just not established)

### 5. Concurrent Claim Attempts (Race Condition)
**Steps:**
1. Follow Marketplace-First flow through step 4
2. Open the signup URL in 2 different browser tabs
3. Complete signup in both tabs simultaneously

**Expected Result:**
✅ First tab: Successfully claims connection
❌ Second tab: Error (connection already claimed)
✅ Database row-level lock prevents duplicate claims

## Verification Checklist

### Database State After SuperSchema-First Flow:
- [ ] Entry exists in `hubspot_connections` table
- [ ] `user_id` matches authenticated user
- [ ] `access_token` and `refresh_token` are encrypted
- [ ] `portal_id` and `portal_name` are populated
- [ ] `scopes` array contains expected permissions
- [ ] NO entry in `pending_hubspot_connections` table

### Database State After Marketplace-First Flow:
- [ ] Entry exists in `hubspot_connections` table (after claim)
- [ ] `user_id` matches newly created user
- [ ] Tokens are decrypted and re-stored properly
- [ ] Entry exists in `pending_hubspot_connections` table
- [ ] Pending entry has `claimed_at` timestamp
- [ ] Pending entry has `claimed_by_user_id` matching user

### Security Verification:
- [ ] State parameter is cryptographically random (32 bytes)
- [ ] State parameter validated on callback (CSRF protection)
- [ ] OAuth tokens stored encrypted in database
- [ ] Pending connections expire after 30 minutes
- [ ] Row-level locking prevents race conditions
- [ ] Cleanup function removes expired entries

### UX Verification:
- [ ] Clear loading states during OAuth flow
- [ ] Success/error messages displayed via toasts
- [ ] Automatic redirect after callback
- [ ] URL cleaned up (query parameters removed)
- [ ] Seamless auto-claim after signup
- [ ] No duplicate connection attempts

## Console Logging

### Server Logs to Watch:
```
🔐 [Auth] Processing optional auth
🔄 [HubSpot Controller] Processing OAuth callback
🎯 [HubSpot Controller] Flow: superschema-first | marketplace-first
✅ [HubSpot Controller] Stored connection
📦 [Pending Connection] Created pending connection
✅ [Pending Connection] Successfully claimed
```

### Client Logs to Watch:
```
🔄 [HubSpotCallback] Starting callback handler
🎯 [HubSpotCallback] Flow 1: SuperSchema-first | Flow 2: Marketplace-first
🔑 [HubSpotCallback] Getting auth token (Flow 1 only)
✅ [HubSpotCallback] Connection successful
🔄 [usePendingHubSpotConnection] Attempting to claim pending connection
✅ [usePendingHubSpotConnection] Successfully claimed connection
```

## Troubleshooting

### Issue: "No authorization code received"
**Cause:** OAuth redirect missing `code` parameter
**Fix:** Check redirect URI configuration in HubSpot app settings

### Issue: "State parameter mismatch"
**Cause:** State parameter in callback doesn't match stored value
**Fix:** Clear browser session storage and try again

### Issue: "Failed to get auth token after retries"
**Cause:** Clerk authentication not complete
**Fix:** Ensure user is fully signed in before initiating OAuth

### Issue: "Connection not found or expired"
**Cause:** Pending connection expired (>30 min) or already claimed
**Fix:** Start OAuth flow again from HubSpot

### Issue: Auto-claim not triggering
**Cause:** Hook not running or pendingConnection parameter missing
**Fix:** Check App.tsx includes `usePendingHubSpotConnection()` hook

## Cleanup

### Remove Test Connections:
```sql
-- Remove specific connection
DELETE FROM hubspot_connections WHERE user_id = 'test_user_id';

-- Remove all pending connections
DELETE FROM pending_hubspot_connections;
```

### Reset Test Users:
1. Delete user from Clerk dashboard
2. Remove user from database:
```sql
DELETE FROM users WHERE id = 'test_user_id';
```

## Next Steps

After successful testing:
1. Monitor production logs for both flows
2. Set up cleanup cron job for expired pending connections:
   ```sql
   SELECT cleanup_expired_pending_hubspot_connections();
   ```
3. Consider adding analytics/tracking for flow adoption
4. Update HubSpot marketplace listing with correct redirect URI
5. Test with production HubSpot app credentials
