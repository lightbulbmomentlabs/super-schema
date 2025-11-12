# HubSpot CRM Integration Troubleshooting Guide

This guide helps diagnose and fix issues with the HubSpot CRM integration that automatically adds SuperSchema users to your company's HubSpot CRM.

## Overview

The HubSpot CRM integration automatically:
1. Adds new users to HubSpot CRM when they sign up via Clerk
2. Sets the `super_schema` custom property to `true` on all contacts
3. Optionally adds contacts to a specific HubSpot list (for email drip campaigns)

## Architecture

```
User signs up via Clerk
  ↓
Clerk sends webhook to /webhooks/clerk
  ↓
handleUserCreated() processes webhook
  ↓
hubspotCRM.createOrUpdateContact() adds user to HubSpot
  ↓
Contact created with super_schema=true
  ↓
Contact added to list (if HUBSPOT_CRM_LIST_ID is set)
```

## Required Configuration

### 1. HubSpot Private App

Create a Private App in HubSpot:
- Go to HubSpot Settings → Integrations → Private Apps
- Click "Create a private app"
- Name: "SuperSchema CRM Integration"
- Required Scopes:
  - `crm.objects.contacts.write` - Create/update contacts
  - `crm.lists.write` - Add contacts to lists
  - `crm.schemas.contacts.read` - Read contact properties
- Copy the access token (starts with `pat-...`)

### 2. Custom Contact Property

Create the `super_schema` property in HubSpot:
- Go to HubSpot Settings → Properties → Contact Properties
- Click "Create property"
- Object type: Contact
- Property name: `super_schema`
- Label: "SuperSchema User"
- Field type: Single checkbox
- Type: Boolean
- Click "Create"

### 3. Environment Variables

Set these in your production environment (Digital Ocean App Platform):

```bash
# Required - HubSpot Private App access token
HUBSPOT_CRM_API_KEY=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional - List ID to add new signups to
HUBSPOT_CRM_LIST_ID=2234
```

### 4. Clerk Webhook Configuration

Verify Clerk is configured to send webhooks:
- Go to Clerk Dashboard → Webhooks
- Endpoint URL: `https://your-domain.com/webhooks/clerk`
- Events to subscribe: `user.created`, `user.updated`
- Verify webhook is active and delivering successfully

## Diagnostic Tools

### 1. Check Production Logs

**Digital Ocean App Platform:**
1. Go to your SuperSchema app
2. Navigate to "Runtime Logs"
3. Search for these key phrases:

**✅ Good signs:**
```
✅ [HubSpot CRM] Service initialized
📋 [HubSpot CRM] List ID configured: 2234
✅ [HubSpot CRM] API connection verified successfully
📨 [Webhook] Received user.created event
✅ [Webhook] User successfully added to HubSpot CRM
```

**❌ Bad signs:**
```
⚠️  [HubSpot CRM] Service disabled - HUBSPOT_CRM_API_KEY not configured
⚠️  [HubSpot CRM] Service not enabled, skipping contact creation
❌ [Webhook] Failed to add user to HubSpot CRM
❌ [HubSpot CRM] API connection verification failed
```

### 2. Run Diagnostics Endpoint

**Endpoint:** `GET /api/admin/hubspot-crm/diagnostics`

**How to use:**
1. Log in as admin to SuperSchema
2. Call the endpoint using curl or the admin panel:

```bash
curl -X GET https://your-domain.com/api/admin/hubspot-crm/diagnostics \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response shows:**
- ✅ `isEnabled: true` - API key is loaded
- ✅ `apiKeyConfigured: true` - API key environment variable is set
- ✅ `connectionStatus: "success"` - HubSpot API is reachable
- ✅ `propertyCheckStatus: "success"` - `super_schema` property exists
- ✅ `listIdConfigured: true` - List ID is set

### 3. Test Contact Creation

**Endpoint:** `POST /api/admin/hubspot-crm/test`

**Body:**
```json
{
  "email": "test@example.com"
}
```

**How to use:**
```bash
curl -X POST https://your-domain.com/api/admin/hubspot-crm/test \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "contactId": "12345678"
  },
  "message": "Test contact created successfully in HubSpot CRM"
}
```

## Common Issues & Solutions

### Issue 1: Service Disabled (API Key Not Loaded)

**Symptoms:**
- Logs show: `⚠️ [HubSpot CRM] Service disabled - HUBSPOT_CRM_API_KEY not configured`
- Diagnostics show: `isEnabled: false`

**Causes:**
1. Environment variable not set in production
2. Environment variable has wrong name
3. App needs restart after setting variable

**Solution:**
1. Go to Digital Ocean App Platform → Environment Variables
2. Verify `HUBSPOT_CRM_API_KEY` is set (not the placeholder)
3. Redeploy the application to pick up new environment variable
4. Check logs for `✅ [HubSpot CRM] Service initialized`

### Issue 2: API Connection Failed

**Symptoms:**
- Logs show: `❌ [HubSpot CRM] API connection verification failed`
- Diagnostics show: `connectionStatus: "failed"`

**Causes:**
1. Invalid API key (expired, revoked, or typo)
2. Private App is disabled in HubSpot
3. API key missing required scopes

**Solution:**
1. Go to HubSpot Settings → Integrations → Private Apps
2. Verify "SuperSchema CRM Integration" app is active
3. Check scopes include: `crm.objects.contacts.write`, `crm.lists.write`, `crm.schemas.contacts.read`
4. If needed, regenerate access token and update environment variable
5. Redeploy application

### Issue 3: Property Not Found

**Symptoms:**
- Logs show: `Invalid contact data or property. Check that super_schema property exists in HubSpot.`
- Diagnostics show: `propertyCheckStatus: "failed"`

**Causes:**
1. `super_schema` property not created in HubSpot
2. Property created with wrong name or type
3. Property created on wrong object (e.g., Company instead of Contact)

**Solution:**
1. Go to HubSpot Settings → Properties → Contact Properties
2. Search for "super_schema"
3. If not found, create it:
   - Object: Contact
   - Property name: `super_schema` (exact spelling, lowercase)
   - Type: Boolean (Single checkbox)
4. Test again using diagnostic endpoint

### Issue 4: Webhooks Not Being Delivered

**Symptoms:**
- Logs show no `📨 [Webhook] Received user.created event` messages
- Users are created in database but not in HubSpot

**Causes:**
1. Clerk webhook not configured
2. Webhook endpoint URL incorrect
3. Webhook events not subscribed
4. Webhook disabled or failing

**Solution:**
1. Go to Clerk Dashboard → Webhooks
2. Find the webhook for your production endpoint
3. Verify:
   - Endpoint URL: `https://your-domain.com/webhooks/clerk`
   - Events: `user.created` is checked
   - Status: Active
4. Click "Testing" and send a test `user.created` event
5. Check "Attempts" tab for delivery status
6. If failing, check error message and fix endpoint/auth issues

### Issue 5: Contacts Created But Not Added to List

**Symptoms:**
- Logs show: `✅ [HubSpot CRM] Contact created/updated successfully`
- But no log: `✅ [HubSpot CRM] Contact added to list successfully`

**Causes:**
1. `HUBSPOT_CRM_LIST_ID` environment variable not set
2. List ID is wrong or list doesn't exist
3. Insufficient permissions to add to list

**Solution:**
1. Go to HubSpot → Lists
2. Find your target list (e.g., "SuperSchema Email Drip")
3. Get the List ID from the URL: `/contacts/[account]/lists/[LIST_ID]/`
4. Set `HUBSPOT_CRM_LIST_ID` environment variable to that ID
5. Verify Private App has `crm.lists.write` scope
6. Redeploy application

### Issue 6: Existing Users Not in HubSpot

**Symptoms:**
- New signups work fine
- But existing users (who signed up before integration was configured) are missing

**Solution:**
Use the backfill endpoint to add all existing users:

**Endpoint:** `POST /api/admin/hubspot-crm/backfill`

**Warning:** This will attempt to add ALL users in the database to HubSpot. It processes up to 10,000 users with a 100ms delay between each to avoid rate limiting.

```bash
curl -X POST https://your-domain.com/api/admin/hubspot-crm/backfill \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 250,
    "successCount": 248,
    "failureCount": 2,
    "errors": [...]
  },
  "message": "Backfill complete: 248 succeeded, 2 failed out of 250 total users"
}
```

## Verification Checklist

After fixing issues, verify the integration works end-to-end:

- [ ] Run diagnostics endpoint - all checks pass
- [ ] Check production logs - see initialization messages
- [ ] Create test user signup
- [ ] Verify webhook delivery in Clerk dashboard
- [ ] Check logs for `✅ [Webhook] User successfully added to HubSpot CRM`
- [ ] Log into HubSpot CRM
- [ ] Find the test contact by email
- [ ] Verify `super_schema` property is checked (true)
- [ ] If using lists, verify contact appears in the configured list

## Monitoring & Maintenance

### Ongoing Monitoring

**Things to check regularly:**
1. Webhook delivery rate in Clerk dashboard (should be 100%)
2. HubSpot API error rate in logs (should be 0%)
3. List growth matches user signups

### Common Maintenance Tasks

**Regenerating API Key:**
1. Go to HubSpot → Private Apps → SuperSchema CRM Integration
2. Click "Regenerate token"
3. Copy new token
4. Update `HUBSPOT_CRM_API_KEY` in Digital Ocean
5. Redeploy application

**Changing Target List:**
1. Get new List ID from HubSpot
2. Update `HUBSPOT_CRM_LIST_ID` in Digital Ocean
3. Redeploy application
4. New signups will go to new list
5. Optionally run backfill to add existing users to new list

## Support

If you're still having issues:

1. **Collect diagnostic information:**
   - Output of `/api/admin/hubspot-crm/diagnostics`
   - Recent logs from Digital Ocean (last 100 lines)
   - Clerk webhook delivery logs
   - Test contact creation result

2. **Check common causes:**
   - Environment variables correctly set?
   - Application redeployed after changes?
   - HubSpot Private App is active?
   - `super_schema` property exists?
   - Clerk webhooks being delivered?

3. **Test components individually:**
   - Does diagnostic endpoint pass all checks?
   - Does test contact creation work?
   - Do Clerk test webhooks deliver successfully?

## Related Files

- Implementation: `server/src/services/hubspotCRM.ts`
- Webhook handler: `server/src/routes/webhooks.ts`
- Admin controller: `server/src/controllers/adminController.ts`
- Admin routes: `server/src/routes/admin.ts`
- Environment config: `app-spec-update.yaml`
- Environment example: `.env.example`
