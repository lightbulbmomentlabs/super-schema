# HubSpot Integration - Testing Guide

## Overview
This document provides instructions for setting up and testing the HubSpot integration locally.

## ⚠️ IMPORTANT: Not Yet Committed to Git
This integration has been fully implemented but **NOT YET COMMITTED** to the repository. All changes are local only.

## What's Been Implemented

### Backend (Complete)
- ✅ Database migration `009_hubspot_integration.sql` - creates tables for connections and sync jobs
- ✅ Encryption service with AES-256-GCM for secure token storage
- ✅ HubSpot OAuth service for token management and refresh
- ✅ HubSpot CMS service for blog posts and pages API interactions
- ✅ Database service methods for HubSpot data
- ✅ API controllers and routes (`/api/hubspot/*`)
- ✅ Environment configuration for HubSpot variables

### API Endpoints
```
POST   /api/hubspot/callback         - Handle OAuth callback
GET    /api/hubspot/connections      - List user's connections
GET    /api/hubspot/connections/:id/validate - Validate connection
DELETE /api/hubspot/connections/:id  - Disconnect account

GET    /api/hubspot/content/posts    - List blog posts
GET    /api/hubspot/content/pages    - List pages
GET    /api/hubspot/content/match    - Match URL to HubSpot content

POST   /api/hubspot/sync/push        - Push schema to HubSpot
GET    /api/hubspot/sync/history     - Get sync history
```

### Frontend (TODO)
- ⏳ HubSpot connection page
- ⏳ Push to HubSpot button in SchemaGenerator
- ⏳ Content matcher modal

## Setup Instructions

### 1. Create HubSpot Developer App

1. Go to [HubSpot Developer Apps](https://developers.hubspot.com/get-started)
2. Click "Create app" or select an existing app
3. In the "Auth" tab, configure:
   - **Redirect URL**: `http://localhost:3000/hubspot/callback` (for local testing)
   - **Scopes**: Select `content` and `oauth`
4. Copy your **Client ID** and **Client Secret**

### 2. Generate Encryption Key
```bash
node scripts/generate-hubspot-key.js
```
Or manually:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Update Environment Files

**Root `.env` file** (server configuration):
```bash
# HubSpot Integration
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_ENCRYPTION_KEY=<paste_generated_key_here>
```

**Client `.env` file** (`client/.env`):
```bash
# HubSpot Integration
VITE_HUBSPOT_CLIENT_ID=your_client_id_here
```

### 4. Run Database Migration
1. Open Supabase SQL Editor: https://app.supabase.com/project/atopvinhrlicujtwltsg/sql/new
2. Copy contents of `database/migrations/009_hubspot_integration.sql`
3. Execute the migration

### 5. Start the Application
```bash
npm run dev
```

The application will be available at:
- **Client**: http://localhost:3000
- **Server**: http://localhost:3001

## Testing the Integration

### Complete End-to-End Testing Flow

#### 1. Connect HubSpot Account
1. Navigate to http://localhost:3000/hubspot
2. Click "Connect HubSpot Account"
3. You'll be redirected to HubSpot's authorization page
4. Log in to your HubSpot account
5. Approve the connection (authorize the `content` and `oauth` scopes)
6. You'll be redirected back to `/hubspot/callback` which will:
   - Exchange the authorization code for access tokens
   - Store encrypted tokens in your database
   - Redirect you back to `/hubspot` with a success message

#### 2. Verify Connection
- On the `/hubspot` page, you should see your connected HubSpot portal
- The connection card will show:
  - Portal name
  - Portal ID
  - Active status (green badge)
  - Connected date
  - Scopes granted

#### 3. Generate Schema
1. Navigate to `/generate`
2. Enter a URL from your website
3. Click "Generate Schema"
4. Wait for schema generation to complete

#### 4. Push Schema to HubSpot
1. After schema is generated, you'll see a "Push to HubSpot" button
2. Click the button
3. A modal will open showing matching HubSpot content
4. The system will auto-match your schema URL to HubSpot blog posts/pages
5. Select the correct content (or verify the auto-selected match)
6. Click "Confirm & Push Schema"
7. Schema will be injected into the HubSpot content's `head_html` field

#### 5. Verify in HubSpot
1. Log in to your HubSpot account
2. Navigate to Marketing > Website > Blog or CMS > Website Pages
3. Find the blog post or page you pushed schema to
4. Click "Edit"
5. Go to Settings > Advanced Options > Head HTML
6. You should see your schema wrapped in `<!-- SuperSchema -->` comments

### Backend Testing with cURL

#### Test Health Check
```bash
curl http://localhost:3001/health
```

#### Test Encryption Setup
```bash
node scripts/generate-hubspot-key.js
```

## Architecture Notes

### Security
- **Token Encryption**: All OAuth tokens encrypted with AES-256-GCM before database storage
- **Token Refresh**: Automatic refresh 5 minutes before expiration
- **Connection Validation**: Validates tokens before API calls

### Database Schema
- `hubspot_connections`: Stores encrypted OAuth credentials
- `hubspot_sync_jobs`: Tracks all schema push operations with status

### API Flow
1. User connects HubSpot → OAuth flow → Clerk callback
2. Backend exchanges code for tokens → Encrypts → Stores in DB
3. User generates schema → Matches to HubSpot content
4. Push schema → API call to HubSpot → Update head_html
5. Track sync job status

## Known Limitations

1. **HubSpot API v3 Pages**: Field name for head HTML not clearly documented in v3 API - may need testing/adjustment
2. **Subscription Requirements**: Head HTML editing requires HubSpot Professional/Enterprise tier
3. **Blog Posts Only**: Blog posts (v2 API) have confirmed `head_html` field support. Pages are experimental.

## Troubleshooting

### "Encryption key not set" Error
- Make sure `HUBSPOT_ENCRYPTION_KEY` is set in `.env`
- Verify key is at least 32 characters (base64 encoded)

### OAuth Errors
- Check `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET`
- Verify redirect URI matches Clerk configuration
- Check Clerk dashboard for OAuth connection status

### Database Errors
- Ensure migration 009 has been run
- Check Supabase connection string
- Verify RLS policies allow access

### Token Refresh Issues
- Check server logs for token expiration warnings
- Verify refresh token is valid in database
- May need to reconnect if refresh token expired (90 days)

## Next Steps (After Testing)

1. **Frontend Implementation**: Build UI components
2. **Testing**: Comprehensive end-to-end testing
3. **Documentation**: Update user-facing docs
4. **Deployment**: Configure production HubSpot app + Clerk OAuth
5. **Monitoring**: Add error tracking and analytics

## File Changes Summary

### New Files
- `database/migrations/009_hubspot_integration.sql`
- `server/src/services/encryption.ts`
- `server/src/services/hubspot/oauth.ts`
- `server/src/services/hubspot/cms.ts`
- `server/src/controllers/hubspotController.ts`
- `server/src/routes/hubspot.ts`

### Modified Files
- `shared/src/types/index.ts` - Added HubSpot types
- `server/src/services/database.ts` - Added HubSpot methods
- `server/src/index.ts` - Registered HubSpot routes
- `server/src/config/env.ts` - Added HubSpot env vars
- `.env.example` - Documented HubSpot variables

## Rollback Instructions

If you need to roll back:

```bash
# Database rollback
Run this in Supabase SQL Editor:
DROP TABLE IF EXISTS hubspot_sync_jobs CASCADE;
DROP TABLE IF EXISTS hubspot_connections CASCADE;
DROP FUNCTION IF EXISTS get_active_hubspot_connection CASCADE;
DROP FUNCTION IF EXISTS get_hubspot_sync_history CASCADE;

# Code rollback
git status  # See all changes
git checkout .  # Reset all changes (if not committed)
```

## Support

For questions or issues:
1. Check server logs in terminal
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Review API responses with Network tab
