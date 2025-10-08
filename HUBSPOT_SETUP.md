# HubSpot Integration - Setup Guide

## Quick Setup (5 Minutes)

### What You Need From Your HubSpot App

From your HubSpot OAuth app, you need:
1. **Client ID**
2. **Client Secret**

These are available in your HubSpot app's Auth settings.

---

## Setup Steps

### Step 1: Generate Encryption Key (30 seconds)

```bash
node scripts/generate-hubspot-key.js
```

Copy the generated encryption key.

---

### Step 2: Update Environment Variables (2 minutes)

**Root `.env` file:**

```bash
# HubSpot Integration
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_ENCRYPTION_KEY=your_generated_encryption_key_here
```

**Client `.env` file (`client/.env`):**

```bash
# HubSpot Integration
VITE_HUBSPOT_CLIENT_ID=your_client_id_here
```

---

### Step 3: Run Database Migration (2 minutes)

1. Open Supabase SQL Editor:
   https://app.supabase.com/project/atopvinhrlicujtwltsg/sql/new

2. Open the migration file:
   ```bash
   cat database/migrations/009_hubspot_integration.sql
   ```

3. Copy the entire contents and paste into Supabase SQL Editor

4. Click **"Run"**

---

### Step 4: Restart Development Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Test the Integration

### 1. Connect HubSpot Account

1. Navigate to http://localhost:3000/hubspot
2. Click **"Connect HubSpot Account"**
3. Log in to HubSpot and authorize
4. You'll be redirected back with your connection visible

✅ **Success**: You should see your HubSpot portal listed with "Active" status

---

### 2. Push Schema to HubSpot

1. Go to http://localhost:3000/generate
2. Enter a URL and generate schema
3. Click **"Push to HubSpot"** button
4. Select matching blog post/page
5. Click **"Confirm & Push Schema"**

✅ **Success**: "Schema successfully pushed to HubSpot!" message appears

---

### 3. Verify in HubSpot

1. Log in to HubSpot
2. Navigate to Marketing > Website > Blog (or CMS > Pages)
3. Edit the blog post/page you pushed to
4. Go to Settings > Advanced Options > Head HTML
5. You should see your schema between `<!-- SuperSchema -->` comments

✅ **Success**: Schema is visible in HubSpot's head HTML

---

## Troubleshooting

### "HubSpot Client ID not configured"
- Make sure `VITE_HUBSPOT_CLIENT_ID` is in `client/.env`
- Restart dev server after adding it

### "Encryption key not set"
- Make sure `HUBSPOT_ENCRYPTION_KEY` is in root `.env`
- Restart dev server

### OAuth redirect fails
- Verify your HubSpot app redirect URL is: `http://localhost:3000/hubspot/callback`
- Check that client ID matches exactly

### Can't find blog posts in modal
- Verify `content` scope is enabled in your HubSpot app
- Make sure you have blog posts in your HubSpot portal
- Try disconnecting and reconnecting your HubSpot account

---

## Architecture Overview

### OAuth Flow
1. User clicks "Connect HubSpot Account"
2. Redirected to HubSpot authorization page
3. User approves connection
4. HubSpot redirects back with authorization code
5. Backend exchanges code for access/refresh tokens
6. Tokens encrypted (AES-256-GCM) and stored in database

### Schema Push Flow
1. User generates schema in SuperSchema
2. System fetches HubSpot blog posts/pages
3. URL matching algorithm finds best content match
4. User confirms selection
5. Schema injected into HubSpot content's `head_html` field
6. Duplicate prevention via HTML comment markers

### Security
- All OAuth tokens encrypted at rest
- Automatic token refresh 5 minutes before expiration
- Tokens decrypted only when making API calls
- User can disconnect at any time

---

## Database Tables

### `hubspot_connections`
Stores encrypted OAuth credentials for each user's HubSpot portal connection.

### `hubspot_sync_jobs`
Tracks all schema push operations with status and error handling.

---

## API Endpoints

```
POST   /api/hubspot/callback         - Handle OAuth callback
GET    /api/hubspot/connections      - List user's connections
GET    /api/hubspot/connections/:id/validate - Validate connection
DELETE /api/hubspot/connections/:id  - Disconnect account

GET    /api/hubspot/content/posts    - List blog posts
GET    /api/hubspot/content/pages    - List pages
GET    /api/hubspot/content/match    - Match URL to content

POST   /api/hubspot/sync/push        - Push schema to HubSpot
GET    /api/hubspot/sync/history     - Get sync history
```

---

## Production Deployment

When deploying to production:

1. Update your HubSpot app redirect URL to include:
   ```
   https://yourdomain.com/hubspot/callback
   ```

2. Update production environment variables with the same credentials

3. All OAuth flows work identically in production

---

## Need Help?

Check the server logs for detailed error messages:
```bash
npm run dev
# Watch the server output for [Auth] and [HubSpot] prefixed logs
```

For more details, see the full technical documentation in `HUBSPOT_INTEGRATION_README.md`.
