# SuperSchema App - Technical Overview

**Last Updated:** 2025-11-18
**Version:** 1.0.0
**Purpose:** Living technical reference for understanding SuperSchema architecture, features, and critical code paths

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Architecture & Infrastructure](#2-architecture--infrastructure)
3. [Core Features](#3-core-features)
4. [Database Schema](#4-database-schema)
5. [Key Code Organization](#5-key-code-organization)
6. [Third-Party Integrations](#6-third-party-integrations)
7. [Security & Authentication](#7-security--authentication)
8. [Critical Code Paths](#8-critical-code-paths)
9. [Known Issues & Tech Debt](#9-known-issues--tech-debt)
10. [Testing & Quality](#10-testing--quality)
11. [Maintenance Instructions](#11-maintenance-instructions)

---

## 1. Application Overview

### Core Purpose
SuperSchema (formerly AEO Schema Generator) is a SaaS application that automatically generates optimized JSON-LD schema markup for websites using AI. The app eliminates the manual complexity of creating schema.org markup, improving visibility in AI-powered search results and traditional SEO.

**Key Value Propositions:**
- AI-powered schema type detection and generation
- Support for multiple schema types per URL (up to 10)
- Real-time schema validation
- HubSpot integration for direct CMS deployment
- Team collaboration for agencies
- URL library for managing generated schemas

### Tech Stack Summary

**Frontend:**
- React 18.3.1 + TypeScript + Vite 5.4.8
- Tailwind CSS v4 (CSS variables for theming)
- React Router 6.26.2
- TanStack Query 5.56.2 (data fetching/caching)
- Clerk 5.8.2 (authentication)
- Stripe React SDK 2.8.0
- Monaco Editor 4.6.0 (JSON editing)
- Framer Motion 11.18.2 (animations)

**Backend:**
- Node.js 20+ + TypeScript + Express 4.19.2
- Puppeteer 23.4.1 (web scraping with JavaScript rendering)
- OpenAI 4.62.1 (GPT-4 Mini) / Anthropic 0.67.0 (Claude)
- BullMQ 5.12.14 + Redis 4.7.0 (job queue)
- Stripe 16.12.0 (payments)
- Zod 3.23.8 (validation)

**Database:**
- Supabase (PostgreSQL) with Row Level Security (RLS)
- UUID primary keys, JSONB for flexible data

**Deployment:**
- **Digital Ocean App Platform** (NOT Vercel)
- Docker multi-stage builds
- Environment-based configuration

### Main User Workflows

1. **Schema Generation:** URL → Validation → Scraping → AI Analysis → Schema(s) → Validation → Edit → Save/Download
2. **HubSpot Integration:** Two flows:
   - SuperSchema-First: User creates account → connects HubSpot → pushes schemas
   - Marketplace-First: User installs from HubSpot → pending connection → creates account → auto-claims → pushes schemas
3. **Credit Purchase:** View packs → Stripe checkout → Payment → Credits added
4. **Team Collaboration:** Create team → Invite members → Shared credits and library

---

## 2. Architecture & Infrastructure

### Application Structure

```
/AEO-Schema-Generator
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── shared/          # Shared TypeScript types
├── database/        # Supabase migrations
├── .do/            # Digital Ocean config
└── Dockerfile      # Multi-stage container
```

**Client:** `/src/pages/`, `/src/components/`, `/src/hooks/`, `/src/services/`, `/src/contexts/`, `/src/utils/`
**Server:** `/src/routes/`, `/src/controllers/`, `/src/services/`, `/src/middleware/`, `/src/config/`, `/src/utils/`

### Deployment (Digital Ocean App Platform)

**Multi-Stage Dockerfile:**
1. Build Stage: Install Chrome dependencies → Build shared/client/server
2. Production Stage: Minimal runtime with production deps only
3. Chrome Support: Full Chromium for Puppeteer

**Key Environment Variables:**

```bash
# Build Time (embedded in client bundle)
VITE_CLERK_PUBLISHABLE_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_CLIENT_URL

# Run Time (server secrets)
SUPABASE_URL
SUPABASE_SERVICE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
HUBSPOT_CLIENT_ID
HUBSPOT_CLIENT_SECRET
HUBSPOT_ENCRYPTION_KEY        # 32-byte hex for AES-256
AI_MODEL_PROVIDER              # "anthropic" or "openai" (default: anthropic)
CLIENT_URL                     # Comma-separated CORS origins
NODE_ENV                       # production, development
PORT                           # 8080 (default)
```

### Build Commands

**Root Level:**
```bash
npm run dev              # Run client + server concurrently
npm run build            # Build shared → client → server
npm run start            # Start production server
npm run type-check       # TypeScript validation all workspaces
npm run lint             # ESLint all workspaces
npm run db:verify        # Verify database setup
```

**Client:**
```bash
npm run dev --workspace=client       # Vite dev server (port 3000)
npm run build --workspace=client     # Production build
npm run preview --workspace=client   # Preview production build
```

**Server:**
```bash
npm run dev --workspace=server       # tsx watch mode
npm run build --workspace=server     # TypeScript compile + copy client dist
npm run start --workspace=server     # Run compiled server
npm run test --workspace=server      # Vitest test runner
```

---

## 3. Core Features

### 3.1 Schema Generation ⚠️ CORE FUNCTIONALITY

**Location:** `/server/src/services/schemaGenerator.ts`, `/server/src/controllers/schemaController.ts`

**Complete Flow:**
1. **URL Validation:** Pre-flight checks for crawler blocking (robots.txt, X-Robots-Tag, meta robots)
2. **Credit Check:** Atomic credit consumption BEFORE generation (prevents race conditions)
3. **Web Scraping:** Puppeteer fetches rendered HTML with full metadata
4. **Content Analysis:** AI analyzes page structure and content
5. **Schema Generation:** AI generates optimal schema type(s)
6. **Validation:** Real-time validation against schema.org
7. **Quality Scoring:** Completeness and accuracy scoring
8. **Database Storage:** Save generation record with status

**Key Features:**
- 10+ schema types supported (Article, Organization, LocalBusiness, Product, Event, etc.)
- Multi-schema per URL (up to 10 types)
- Schema refinement system (max 3 refinements)
- AI provider switching (OpenAI GPT-4 Mini or Anthropic Claude)
- Crawler blocking detection with user-friendly errors
- **Credit protection:** Only charged on success

**Critical Files:**
- `/server/src/services/schemaGenerator.ts` - Main orchestration
- `/server/src/services/scraper.ts` - Puppeteer scraping (1,002 lines)
- `/server/src/services/openai.ts` - OpenAI integration (99KB)
- `/server/src/services/anthropic.ts` - Anthropic integration (22KB)
- `/server/src/services/schemaValidator.ts` - Validation logic
- `/server/src/services/urlValidator.ts` - URL accessibility checks

**API Endpoints:**
- `POST /api/schema/generate` - Generate schema (authenticated)
- `POST /api/schema/validate` - Validate schema
- `POST /api/schema/refine` - Refine existing schema
- `POST /api/schema/extract` - Extract metadata (PUBLIC)
- `GET /api/schema/history` - Generation history

### 3.2 HubSpot OAuth Integration ⚠️ COMPLEX FLOW

**Location:** `/server/src/services/hubspot/oauth.ts` (498 lines), `/server/src/controllers/hubspotController.ts` (786 lines)

**Dual OAuth Flows:**

**Flow 1: SuperSchema-First (Traditional)**
```
1. User authenticated in SuperSchema
2. Click "Connect HubSpot"
3. Redirect to HubSpot OAuth consent
4. User approves permissions
5. HubSpot redirects to /hubspot/callback with code
6. Server exchanges code for access/refresh tokens
7. Tokens encrypted with AES-256-CBC
8. Connection stored in hubspot_connections table
9. User can push schemas to HubSpot CMS
```

**Flow 2: Marketplace-First (Innovative) ⚠️**
```
1. User installs SuperSchema from HubSpot Marketplace
2. HubSpot redirects to /hubspot/callback (NO authentication!)
3. Server IMMEDIATELY exchanges code for tokens (60s expiration!)
4. Tokens encrypted, stored in pending_hubspot_connections
5. State token generated (server-side UUID)
6. User redirected to signup with state parameter
7. User completes signup
8. Client auto-claims pending connection via state token
9. Connection moved to hubspot_connections
10. User authenticated AND HubSpot connected
```

**Critical Design Points:**
- **Regional Routing:** HubSpot uses unified `api.hubapi.com` for ALL regions (na1, eu1, ap1)
- **Code Expiration:** OAuth codes expire in ~60 seconds - MUST exchange immediately
- **Token Encryption:** AES-256-CBC with `HUBSPOT_ENCRYPTION_KEY`
- **Token Refresh:** Auto-refresh when expiration within 5 minutes
- **Pending Cleanup:** Cron job every 15 minutes deletes expired pending connections
- **State Parameter:** CSRF protection with cryptographically secure tokens

**HubSpot CMS Features:**
- List blog posts and pages from portal
- Match URLs to HubSpot content (domain-based auto-matching)
- Push schemas to content `<head>` section
- Track sync history in `hubspot_sync_jobs`
- Domain associations for auto-detection

**Database Tables:**
- `hubspot_connections` - Active OAuth connections
- `pending_hubspot_connections` - Marketplace-first temp storage
- `hubspot_sync_jobs` - Schema push history
- `hubspot_domain_associations` - Domain to connection mapping

**API Endpoints:**
- `POST /api/hubspot/callback` - OAuth callback (optional auth)
- `POST /api/hubspot/claim` - Claim pending connection
- `GET /api/hubspot/connections` - List connections
- `GET /api/hubspot/connections/:id/validate` - Validate connection
- `DELETE /api/hubspot/connections/:id` - Disconnect
- `GET /api/hubspot/content/posts` - List blog posts
- `GET /api/hubspot/content/pages` - List pages
- `POST /api/hubspot/sync/push` - Push schema to HubSpot

**Critical Files:**
- `/server/src/services/hubspot/oauth.ts:31-156` - Marketplace callback flow
- `/server/src/services/encryption.ts` - AES-256-CBC token encryption
- `/client/src/pages/HubSpotCallbackPage.tsx` (16KB) - Client-side claim flow
- `/client/src/hooks/usePendingHubSpotConnection.tsx` - Auto-claim hook

### 3.3 Stripe Payment Integration ⚠️ FINANCIAL

**Location:** `/server/src/services/stripe.ts` (308 lines), `/server/src/controllers/paymentController.ts`

**Payment Flow:**
```
1. User selects credit pack
2. Client calls /api/payment/create-intent
3. Server creates Stripe Payment Intent with metadata
4. Payment Intent saved to payment_intents (status: pending)
5. Client renders Stripe Elements with clientSecret
6. User completes payment
7. Stripe webhook fires payment_intent.succeeded
8. Server verifies webhook signature
9. Payment Intent status → succeeded
10. Credits added via db.addCredits()
11. Credit transaction recorded with Stripe payment ID
12. Analytics tracked
```

**Webhook Events Handled:**
- `payment_intent.succeeded` - Add credits to user
- `payment_intent.payment_failed` - Update status to failed
- `payment_intent.canceled` - Update status to canceled

**Credit Packs:**
```sql
Starter:     20 credits @ $9.99   ($0.50/credit)
Professional: 50 credits @ $19.99  (20% savings)
Business:    100 credits @ $34.99  (30% savings)
Agency:      250 credits @ $74.99  (40% savings)
Enterprise:  500 credits @ $124.99 (50% savings)
```

**Security:**
- Webhook signature verification (STRIPE_WEBHOOK_SECRET)
- Idempotency via payment_intent ID
- Raw body parsing for signature validation
- Service role bypass for RLS

**API Endpoints:**
- `GET /api/payment/credit-packs` - List packs
- `POST /api/payment/create-intent` - Create intent
- `GET /api/payment/history` - Payment history
- `GET /api/payment/config` - Stripe publishable key
- `POST /webhooks/stripe` - Webhook handler (raw body)

**Critical Files:**
- `/server/src/services/stripe.ts:111-124` - Webhook signature verification
- `/server/src/routes/webhooks.ts` - Raw body parsing middleware

### 3.4 Credits System ⚠️ ATOMIC OPERATIONS

**Location:** `/server/src/services/database.ts`, `/database/migrations/022_atomic_credit_consumption_v2.sql`

**Credit Operations:**

1. **Add Credits:** `db.addCredits(userId, amount, description, paymentIntentId)`
   - Creates credit transaction (type: purchase, bonus, refund)
   - Updates user's credit_balance
   - Returns new balance

2. **Consume Credits (Atomic):** `db.consumeCreditsAtomic(userId, amount, description)`
   - **Race-condition safe!**
   - Uses PostgreSQL `SELECT FOR UPDATE SKIP LOCKED`
   - Prevents duplicate charges during concurrent requests
   - Returns boolean (true if consumed, false if insufficient or busy)

**Credit Tracking:**
- `users.credit_balance` - Current available credits
- `users.total_credits_used` - Lifetime usage counter
- `credit_transactions` - Full audit log
- Transaction types: `purchase`, `usage`, `refund`, `bonus`

**Credit Protection:**
- Credits only consumed on SUCCESSFUL generation
- Failed generations do NOT charge
- First schema for URL charges 1 credit
- Additional schemas for same URL are FREE (up to 10 types)

**Critical Code:**
- `/database/migrations/022_atomic_credit_consumption_v2.sql` - PostgreSQL function with row locking
- `/server/src/services/schemaGenerator.ts:56-94` - Atomic consumption in schema flow

### 3.5 Team Collaboration (Feature Flagged)

**Location:** `/server/src/services/teamService.ts`, `/client/src/contexts/TeamContext.tsx`

**Team Features:**
- Team-of-one model (every user is a team owner)
- Invite members via secure link (7-day expiration)
- Shared credit pool and URL library
- Maximum 10 members per team
- Team context fetched with every authenticated request

**Flow:**
```
1. Team owner creates team (auto-created on first use)
2. Generate invite link with cryptographically secure token
3. Team member clicks link
4. Validates invite token
5. Accepts invite → joins team
6. Shared access to credits and schemas
```

**Database Tables:**
- `teams` - Team records (owner_id)
- `team_members` - Member relationships (max 10 per team)
- `team_invites` - Invite tokens (7-day expiration)

**Feature Flag:**
```typescript
// server/src/config/features.ts
export const FEATURE_FLAGS = {
  TEAMS_ENABLED: process.env.TEAMS_ENABLED === 'true'
}
```

**API Endpoints:**
- `GET /api/team/current` - Get active team
- `POST /api/team` - Create team
- `POST /api/team/switch/:teamId` - Switch active team
- `GET /api/team/:teamId/members` - List members
- `DELETE /api/team/:teamId/members/:userId` - Remove member
- `POST /api/team/:teamId/invites` - Create invite
- `POST /api/team/invites/:token/accept` - Accept invite

### 3.6 Additional Features

**Version Detection:**
- Client checks `/health` endpoint every 30 minutes
- Compares server buildTime with local BUILD_TIME
- Shows notification if versions differ
- Location: `/client/src/hooks/useVersionCheck.tsx`

**Analytics Tracking:**
- Tracks: schema_generation, schema_validation, credit_purchase, login, signup
- Location: `/server/src/services/database.ts` - `trackUsage()` function
- Admin dashboard: `/client/src/pages/admin/AdminAnalytics.tsx`

**URL Library:**
- Organize schemas by domain
- Batch schema generation
- Multi-schema support per URL
- Domain filtering
- Schema deletion (limited regenerations)

**Support System:**
- In-app support tickets
- Categories: general, feature_request, bug_report
- Admin ticket management
- Location: `/server/src/routes/support.ts`

**Release Notes:**
- What's New notifications
- Admin content management
- Categories: new_feature, enhancement, performance, bug_fix
- Location: `/client/src/hooks/useWhatsNewNotifications.tsx`

---

## 4. Database Schema

### 4.1 Critical Tables (Full Schema)

**users**
```sql
id TEXT PRIMARY KEY                    -- Clerk user ID
email TEXT NOT NULL UNIQUE
first_name TEXT
last_name TEXT
credit_balance INTEGER DEFAULT 2        -- Current credits (2 free on signup)
total_credits_used INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
organization_name TEXT                  -- For teams/agencies
active_team_id UUID REF teams(id)      -- Current team context
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**credit_transactions**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id)
team_id UUID REF teams(id)             -- Nullable, for team context
type TEXT NOT NULL                      -- purchase, usage, refund, bonus
amount INTEGER NOT NULL                 -- Positive=add, Negative=usage
description TEXT
stripe_payment_intent_id TEXT
created_at TIMESTAMPTZ DEFAULT NOW()

INDEX: user_id, team_id, created_at, type
```

**schema_generations**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id) NOT NULL
team_id UUID REF teams(id)             -- Nullable
discovered_url_id UUID REF discovered_urls(id)
url TEXT NOT NULL
schemas JSONB                           -- Array of schema objects
status TEXT NOT NULL                    -- success, failed, processing
error_message TEXT
credits_cost INTEGER DEFAULT 1
processing_time_ms INTEGER
schema_type TEXT DEFAULT 'Auto'
schema_score JSONB                      -- Quality scoring
refinement_count INTEGER DEFAULT 0
scraper_diagnostics JSONB              -- Debug info (large!)
created_at TIMESTAMPTZ DEFAULT NOW()

INDEX: user_id, team_id, created_at, status, url
```

**discovered_urls**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id) NOT NULL
team_id UUID REF teams(id)
domain_id UUID REF user_domains(id)
url TEXT NOT NULL
path TEXT
path_depth INTEGER
deletion_count INTEGER DEFAULT 0        -- Track regenerations (limit 3)
schema_count INTEGER DEFAULT 0          -- Number of schema types
created_at TIMESTAMPTZ DEFAULT NOW()

UNIQUE: (user_id, url) or (team_id, url)
INDEX: user_id, team_id, domain_id, created_at
```

**user_domains**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id) NOT NULL
team_id UUID REF teams(id)
domain TEXT NOT NULL                    -- e.g., "example.com"
url_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()

UNIQUE: (user_id, domain) or (team_id, domain)
INDEX: user_id, team_id, domain
```

**hubspot_connections**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id) NOT NULL
team_id UUID REF teams(id)
hubspot_portal_id TEXT NOT NULL
portal_name TEXT
access_token TEXT NOT NULL              -- Encrypted with AES-256-CBC
refresh_token TEXT NOT NULL             -- Encrypted
token_expires_at TIMESTAMPTZ
scopes TEXT[]                           -- OAuth scopes granted
region TEXT DEFAULT 'na1'               -- na1, eu1, ap1 (stored but not used for API)
is_active BOOLEAN DEFAULT true
last_validated_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

UNIQUE: (user_id, hubspot_portal_id) or (team_id, hubspot_portal_id)
INDEX: user_id, team_id, is_active, hubspot_portal_id
```

**pending_hubspot_connections ⚠️**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
state_token TEXT NOT NULL UNIQUE        -- CSRF protection
oauth_code TEXT NOT NULL                -- Actually encrypted tokens (JSON)
hubspot_portal_id TEXT
portal_name TEXT
redirect_uri TEXT
scopes TEXT[]
expires_at TIMESTAMPTZ                  -- Auto-cleanup after 30 min
created_at TIMESTAMPTZ DEFAULT NOW()
claimed_at TIMESTAMPTZ
claimed_by TEXT REF users(id)
oauth_flow_type TEXT                    -- 'superschema_first' or 'marketplace_first'
server_generated_state BOOLEAN          -- Track state generation location
```

**hubspot_sync_jobs**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id TEXT REF users(id) NOT NULL
connection_id UUID REF hubspot_connections(id)
schema_generation_id UUID REF schema_generations(id)
hubspot_content_id TEXT                 -- HubSpot blog/page ID
hubspot_content_type TEXT               -- blog_post, page, landing_page
hubspot_content_title TEXT
hubspot_content_url TEXT
status TEXT                             -- pending, success, failed, retrying
error_message TEXT
retry_count INTEGER DEFAULT 0
synced_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()

INDEX: user_id, connection_id, status, created_at
```

**teams**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_id TEXT REF users(id) ON DELETE CASCADE NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

INDEX: owner_id
```

**team_members**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
team_id UUID REF teams(id) ON DELETE CASCADE NOT NULL
user_id TEXT REF users(id) ON DELETE CASCADE NOT NULL
invited_at TIMESTAMPTZ
joined_at TIMESTAMPTZ DEFAULT NOW()

UNIQUE: (team_id, user_id)
INDEX: team_id, user_id
TRIGGER: enforce_team_member_limit (max 10 members)
```

**team_invites**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
team_id UUID REF teams(id) ON DELETE CASCADE NOT NULL
invite_token TEXT NOT NULL UNIQUE       -- Cryptographically secure (32 bytes)
created_by TEXT REF users(id)
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ NOT NULL         -- 7 days from creation
used_at TIMESTAMPTZ
used_by TEXT REF users(id)

INDEX: invite_token, expires_at
```

### 4.2 Supporting Tables (High-Level)

- `credit_packs` - Predefined credit packages (5 tiers with pricing)
- `payment_intents` - Stripe payment tracking (status, amount, user_id)
- `usage_analytics` - Event tracking (action, metadata JSONB, user_id, timestamp)
- `support_tickets` - User support requests (category, status, description)
- `release_notes` - What's New content (category, content, published_at)
- `hubspot_domain_associations` - Domain to connection mapping
- `error_logs` - Application error logging (error_type, message, stack_trace)
- `imported_schemas` - Track schema preview/imports

### 4.3 Row Level Security (RLS)

**All tables have RLS enabled:**

- Users can only access their own data: `WHERE user_id = auth.uid()`
- Team members can access team data: `WHERE team_id IN (SELECT get_user_teams(auth.uid()))`
- Service role has full access (for backend operations)
- Credit packs are publicly readable
- Admin users have elevated permissions via `is_admin()` function

**Key RLS Functions:**
```sql
is_team_owner(user_id, team_id)           -- Check team ownership
is_team_member(user_id, team_id)          -- Check team membership
get_user_teams(user_id)                   -- Get all teams for user
is_admin(user_id)                         -- Check admin privileges
```

---

## 5. Key Code Organization

### 5.1 Important React Components

**Schema Generation:**
- `/client/src/pages/GeneratePage.tsx` - Main schema generation interface
- `/client/src/components/SchemaEditor.tsx` - Monaco editor for JSON editing

**HubSpot Integration:**
- `/client/src/pages/HubSpotPage.tsx` (22KB) - Connection management UI
- `/client/src/pages/HubSpotCallbackPage.tsx` (16KB) - OAuth callback handler
- `/client/src/components/HubSpotContentMatcher.tsx` (16KB) - URL matching logic

**Library Management:**
- `/client/src/pages/LibraryPage.tsx` (70KB) - URL library with bulk operations

**Admin Dashboard:**
- `/client/src/pages/admin/AdminAnalytics.tsx` - Analytics overview
- `/client/src/pages/admin/AdminUsers.tsx` - User management
- `/client/src/pages/admin/AdminMonitoring.tsx` - Error logs and monitoring
- `/client/src/pages/admin/AdminTickets.tsx` - Support ticket management
- `/client/src/pages/admin/AdminContent.tsx` - Release notes management
- `/client/src/components/AdminPurchaseAnalytics.tsx` (20KB) - Purchase metrics

**Team Management:**
- `/client/src/pages/TeamSettingsPage.tsx` (24KB) - Team settings
- `/client/src/pages/JoinTeamPage.tsx` (15KB) - Team invite acceptance
- `/client/src/components/CreateTeamModal.tsx` - Team creation

**Payment:**
- `/client/src/components/CreditPurchase.tsx` (11KB) - Stripe integration
- `/client/src/pages/CreditsPage.tsx` - Credit management

**Layout:**
- `/client/src/components/Layout.tsx` - Main app layout
- `/client/src/components/AdminLayout.tsx` - Admin area layout
- `/client/src/components/Header.tsx`, `/client/src/components/Footer.tsx`

### 5.2 Routing Structure

**Public Routes:**
- `/` - Landing page
- `/pricing` - Pricing page
- `/sign-in`, `/sign-up` - Clerk auth
- `/welcome` - Post-signup onboarding
- `/docs` - Documentation
- `/free-schema-generator` - Public tool (no auth)

**Protected Routes:**
- `/generate` - Schema generation tool
- `/library` - URL library
- `/hubspot` - HubSpot integration
- `/dashboard/*` - Dashboard routes
- `/settings` - User settings
- `/team/*` - Team management (feature flagged)

**Admin Routes:**
- `/admin` - Admin layout wrapper
- `/admin/analytics` - Analytics dashboard
- `/admin/users` - User management
- `/admin/monitoring` - Error monitoring
- `/admin/tickets` - Support tickets
- `/admin/content` - Content management

**Educational/SEO Routes:**
- `/aeo`, `/geo`, `/ai-search-optimization`, `/schema-markup` - Pillar pages

### 5.3 API Endpoint Map

**Schema:** `/api/schema`
- `POST /generate` - Generate schema (authenticated)
- `POST /validate` - Validate schema
- `POST /refine` - Refine schema
- `POST /extract` - Extract metadata (PUBLIC)
- `GET /history` - Generation history
- `DELETE /:id` - Delete schema

**User:** `/api/user`
- `GET /me` - Get current user
- `GET /stats` - User statistics
- `PATCH /organization-name` - Update org name

**Payment:** `/api/payment`
- `GET /credit-packs` - List packs
- `POST /create-intent` - Create payment intent
- `GET /history` - Payment history
- `GET /config` - Stripe publishable key

**HubSpot:** `/api/hubspot`
- `POST /callback` - OAuth callback (optional auth)
- `POST /claim` - Claim pending connection
- `GET /connections` - List connections
- `DELETE /connections/:id` - Disconnect
- `GET /content/posts`, `/content/pages` - List CMS content
- `POST /sync/push` - Push schema to HubSpot

**Team:** `/api/team`
- `GET /current` - Get active team
- `POST /` - Create team
- `POST /switch/:teamId` - Switch team
- `GET /:teamId/members` - List members
- `POST /:teamId/invites` - Create invite
- `POST /invites/:token/accept` - Accept invite

**Admin:** `/api/admin`
- `GET /stats` - Platform statistics
- `GET /users` - List users with pagination
- `GET /power-users` - Top users by usage
- `GET /schema-failures` - Failed generations
- `GET /errors` - Error logs
- `POST /users/:userId/credits` - Grant credits

**Webhooks:** `/webhooks`
- `POST /stripe` - Stripe webhook (raw body)
- `POST /clerk` - Clerk webhook (user sync)

**Other:**
- `/health` - Health check (version, status)
- `GET /api/release-notes` - List release notes

### 5.4 State Management

**React Query (TanStack Query):**
- 5-minute stale time
- 30-minute garbage collection
- Retry logic: skip 4xx, retry 5xx once
- No auto-refetch on window focus
- Centralized in `/client/src/main.tsx`

**React Contexts:**
- `OnboardingContext` - User onboarding flow state
- `ThemeContext` - Light/dark mode
- `TeamContext` - Team-related state

**Custom Hooks:**
- `useAdminBadgeCounts` - Admin notification badges
- `useIsAdmin` - Check admin status
- `usePendingHubSpotConnection` - Auto-claim marketplace installs
- `useTeam` - Team operations
- `useVersionCheck` - Version detection
- `useWhatsNewNotifications` - Release notes

### 5.5 Utility Functions

**URL Helpers:** `/server/src/utils/urlHelpers.ts`
- `extractBaseDomain(url)` - Get root domain
- `extractPath(url)` - Get URL path
- `calculatePathDepth(path)` - Count path segments

**Schema Type Detector:** `/server/src/utils/schemaTypeDetector.ts`
- `extractSchemaType(schema)` - Determine schema @type

**Auth Token Manager:** `/client/src/utils/authTokenManager.ts`
- Singleton for Clerk token management
- Used by API interceptors

**Encryption:** `/server/src/services/encryption.ts`
- `encrypt(text)` - AES-256-CBC encryption
- `decrypt(encrypted)` - AES-256-CBC decryption

---

## 6. Third-Party Integrations

### 6.1 HubSpot Integration (COMPLETE FLOW)

**Configuration:**
```env
HUBSPOT_CLIENT_ID=xxx
HUBSPOT_CLIENT_SECRET=xxx
HUBSPOT_ENCRYPTION_KEY=xxx  # 32-byte hex for AES-256
```

**OAuth Scopes Required:**
- `content` - Read/write CMS content
- `oauth` - OAuth access
- `cms.domains.read` - Domain settings
- `cms.blogs.read` / `cms.blogs.write` - Blog access
- `cms.pages.read` / `cms.pages.write` - Page access

**Regional Handling ⚠️ CRITICAL:**
- HubSpot uses UNIFIED `api.hubapi.com` for ALL regions
- Authorization codes prefixed with region (na1-, eu1-, ap1-)
- Region extracted and stored BUT API endpoint is always the same
- HubSpot's Cloudflare Workers handle regional routing

**Token Management:**
- Access tokens expire (~6 hours typical)
- Refresh tokens used to get new access tokens
- Tokens auto-refreshed when expiring within 5 minutes
- Encrypted at rest with AES-256-CBC

**CMS Operations:**
```typescript
// List blog posts
GET /content/api/v2/blog-posts

// Update blog post (add schema)
PATCH /content/api/v2/blog-posts/{id}
{ "head_html": "<script type=\"application/ld+json\">...</script>" }
```

**Error Handling:**
- Token expiration: Automatic refresh
- Invalid credentials: User-friendly messages
- Connection validation: Health check endpoint

**Critical Files:**
- `/server/src/services/hubspot/oauth.ts` - OAuth lifecycle
- `/server/src/services/hubspot/cms.ts` - CMS API operations
- `/server/src/services/encryption.ts` - Token encryption
- `/database/migrations/009_hubspot_integration.sql` - Schema
- `/database/migrations/023_pending_hubspot_connections.sql` - Marketplace flow

### 6.2 Stripe Integration (COMPLETE FLOW)

**Configuration:**
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Payment Flow:**
```typescript
// 1. Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 999,  // cents
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
  metadata: { userId, creditPackId, credits }
})

// 2. Client confirms with Stripe Elements

// 3. Webhook receives payment_intent.succeeded
const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

// 4. Add credits
await db.addCredits(userId, credits, description, paymentIntentId)
```

**Webhook Security:**
- Raw body required for signature verification
- Signature verified before processing
- Idempotency via payment_intent ID
- Status updates prevent duplicate processing

**Client Integration:**
```typescript
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(publishableKey)
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentForm />
</Elements>
```

**Critical Files:**
- `/server/src/services/stripe.ts:111-124` - Webhook signature verification
- `/server/src/routes/webhooks.ts` - Raw body middleware

### 6.3 Supabase Integration

**Configuration:**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Client Setup:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

**Usage:**
- All queries use service role key (bypasses RLS)
- Manual SQL migrations in `/database/migrations/`
- Run via Supabase SQL Editor
- `deploy-all.sql` for one-step deployment

### 6.4 OpenAI/Anthropic Integration

**Model Selection:**
```env
AI_MODEL_PROVIDER=anthropic  # or 'openai'
```

**OpenAI:**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  temperature: 0.7,
  max_tokens: 4000
})
```

**Anthropic:**
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [...]
})
```

**Cost Optimization:**
- GPT-4 Mini: ~10x cheaper than GPT-4
- Claude Sonnet: Mid-tier pricing, high quality
- Content truncation for large pages

### 6.5 Clerk Integration

**Configuration:**
```env
CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

**Client:**
```typescript
import { ClerkProvider } from '@clerk/clerk-react'
<ClerkProvider publishableKey={publishableKey}>
  <App />
</ClerkProvider>
```

**Server:**
- Manual JWT decode (no Clerk Express SDK verification)
- Extract user ID from token `sub` claim
- Webhook for user sync (user.created, user.updated)

**User Sync Flow:**
1. User signs up in Clerk
2. Clerk fires `user.created` webhook
3. Server receives at `/webhooks/clerk`
4. Verify signature with `svix` library
5. Call `db.upsertUserFromClerk()`
6. User created in Supabase with 2 free credits

### 6.6 Google Analytics 4 (GA4) Integration

**Purpose:** Track AI crawler traffic on user websites using Google Analytics 4 data. Calculate AI Visibility Score based on crawler diversity and page coverage.

**Configuration:**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_ENCRYPTION_KEY=xxx  # 32-byte hex for AES-256 (same as HubSpot)
GA4_AI_ANALYTICS_ENABLED=true
```

**OAuth Scopes Required:**
- `https://www.googleapis.com/auth/analytics.readonly` - Read GA4 data
- `https://www.googleapis.com/auth/userinfo.email` - User identification

**OAuth Flow:**
```typescript
// 1. Generate auth URL
GET /api/ga4/auth-url
→ { authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." }

// 2. User authorizes in Google
// Redirected to callback with code

// 3. Exchange code for tokens
POST /api/ga4/callback
{ code, state }
→ Stores encrypted access_token and refresh_token

// 4. Tokens auto-refresh when expiring
```

**Token Management:**
- Access tokens expire in ~1 hour
- Refresh tokens used to get new access tokens
- Tokens auto-refreshed on API calls
- Encrypted at rest with AES-256-CBC (reuses encryption service)
- Connection per user (not per domain)

**Domain Mapping:**
```typescript
// Map a GA4 property to a domain
POST /api/ga4/domain-mapping
{
  propertyId: "properties/123456789",
  propertyName: "My Website",
  domain: "example.com"
}

// List all mappings
GET /api/ga4/domain-mappings
→ [{ id, propertyId, propertyName, domain, isActive, ... }]
```

**AI Crawler Detection:**
Identifies AI crawlers by pattern matching on `sessionSource` and `pageReferrer` dimensions:

```typescript
const AI_CRAWLERS = {
  'ChatGPT': ['ChatGPT-User', 'ChatGPT', 'GPTBot'],
  'Claude': ['Claude-Web', 'ClaudeBot', 'anthropic-ai'],
  'Gemini': ['Google-Extended', 'Gemini', 'Bard'],
  'Perplexity': ['PerplexityBot', 'Perplexity'],
  'SearchGPT': ['SearchGPT', 'OAI-SearchBot'],
  // ... more crawlers
}
```

**Metrics Calculation:**
```typescript
// AI Visibility Score = (AI Diversity × 0.5) + (Coverage × 0.5)
// - AI Diversity: Number of unique AI crawlers (0-100)
// - Coverage: % of pages crawled by AI (0-100)

interface GA4Metrics {
  aiVisibilityScore: number        // 0-100
  aiDiversityScore: number          // Number of unique crawlers
  coveragePercentage: number        // % of pages crawled
  totalPages: number                // Total pages on site
  aiCrawledPages: number            // Pages with AI traffic
  crawlerList: string[]             // List of detected crawlers
  topCrawlers: CrawlerStats[]       // Top crawlers by activity
  topPages: PageCrawlerInfo[]       // Pages with most crawler diversity
  dateRangeStart: string
  dateRangeEnd: string
}
```

**API Query Structure:**
```typescript
// Query GA4 Data API
const request = {
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate, endDate }],
  dimensions: [
    { name: 'sessionSource' },
    { name: 'pageReferrer' },
    { name: 'pagePath' }
  ],
  metrics: [
    { name: 'sessions' },
    { name: 'screenPageViews' }
  ],
  limit: 100000  // Max results
}
```

**Caching Strategy:**
```typescript
// Metrics cached for 24 hours per property/date range
// Table: ga4_crawler_metrics
// Daily cron job (2 AM) refreshes all active connections
// Manual refresh available via UI or API

// Check cache
const cached = await db.getGA4CachedMetrics(userId, propertyId, startDate, endDate)
if (cached && !isStale(cached)) {
  return cached.metrics
}

// Fetch fresh data
const metrics = await ga4Data.getAICrawlerMetrics(propertyId, startDate, endDate, tokens)
await db.storeGA4Metrics(userId, propertyId, metrics, startDate, endDate)
```

**Frontend Implementation:**

**Routes:**
- `/ai-analytics` - Main dashboard (AIAnalyticsPage)
- `/ga4/connect` - OAuth connection + domain mapping (GA4ConnectPage)
- `/ga4/callback` - OAuth callback handler (GA4CallbackPage)

**Custom Hooks:**
```typescript
// Connection status
const { connected, connection, disconnect } = useGA4Connection()

// Metrics fetching
const { metrics, refresh, isRefreshing } = useGA4Metrics(
  propertyId,
  startDate,
  endDate,
  enabled
)

// Domain mappings
const { mappings, createMapping, deleteMapping } = useGA4DomainMappings(connected)
```

**Components:**
- `AIVisibilityScoreCard` - Circular progress score display
- `TopCrawlersTable` - Table of top AI crawlers
- `CrawlerListWidget` - Badge list of detected crawlers
- `GA4ConnectionStatus` - Connection status indicator
- `DomainMappingSelector` - Dropdown for domain selection

**Automated Refresh:**
```typescript
// Daily cron job at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  await ga4MetricsRefreshService.refreshAllMetrics()
})

// Refreshes metrics for all active GA4 connections
// Uses last 30 days date range
// Handles token refresh automatically
```

**Database Tables:**

**ga4_connections:**
```sql
- id UUID PRIMARY KEY
- user_id TEXT NOT NULL (Clerk user ID)
- team_id UUID (nullable)
- access_token TEXT NOT NULL (encrypted)
- refresh_token TEXT NOT NULL (encrypted)
- token_expires_at TIMESTAMPTZ
- scopes TEXT[]
- is_active BOOLEAN DEFAULT true
- last_validated_at TIMESTAMPTZ
- connected_at TIMESTAMPTZ
```

**ga4_domain_mappings:**
```sql
- id UUID PRIMARY KEY
- user_id TEXT NOT NULL
- team_id UUID (nullable)
- connection_id TEXT NOT NULL
- property_id TEXT NOT NULL
- property_name TEXT NOT NULL
- domain TEXT NOT NULL
- is_active BOOLEAN DEFAULT true
```

**ga4_crawler_metrics:**
```sql
- id UUID PRIMARY KEY
- user_id TEXT NOT NULL
- property_id TEXT NOT NULL
- metrics JSONB NOT NULL
- date_range_start DATE NOT NULL
- date_range_end DATE NOT NULL
- fetched_at TIMESTAMPTZ DEFAULT NOW()
```

**Critical Files:**
- `/server/src/services/ga4/oauth.ts` - OAuth lifecycle + token management
- `/server/src/services/ga4/data.ts` - GA4 Data API queries + metrics calculation
- `/server/src/services/ga4/metricsRefreshService.ts` - Automated daily refresh
- `/server/src/controllers/ga4Controller.ts` - API endpoints
- `/server/src/routes/ga4.ts` - Route definitions
- `/database/migrations/026_ga4_ai_crawler_analytics.sql` - Schema
- `/client/src/pages/AIAnalyticsPage.tsx` - Main dashboard
- `/client/src/hooks/useGA4*.ts` - React Query hooks

**API Endpoints:**
```typescript
GET  /api/ga4/auth-url              - Generate OAuth URL
POST /api/ga4/callback              - Exchange code for tokens
GET  /api/ga4/connection            - Get connection status
DELETE /api/ga4/connection          - Disconnect GA4
GET  /api/ga4/properties            - List accessible properties
POST /api/ga4/domain-mapping        - Create domain mapping
GET  /api/ga4/domain-mappings       - List all mappings
DELETE /api/ga4/domain-mapping/:id  - Delete mapping
GET  /api/ga4/metrics               - Get cached metrics
POST /api/ga4/metrics/refresh       - Force refresh from API
```

**Error Handling:**
- Token expiration: Automatic refresh with refresh_token
- Invalid credentials: Clear user-friendly messages
- API rate limits: Respect GA4 quotas
- Missing permissions: Prompt for re-authorization
- Connection validation: Health check before operations

**Security Considerations:**
- Tokens encrypted at rest (AES-256-CBC)
- Row Level Security (RLS) on all tables
- User can only access their own data
- Team support (nullable team_id)
- State parameter validation in OAuth flow
- No team RLS policies (migration 016 not run)

---

## 7. Security & Authentication

### 7.1 Authentication Implementation

**JWT Token Flow:**
```
1. User authenticates with Clerk
2. Clerk issues JWT token
3. Client stores token (via Clerk SDK)
4. Client attaches: Authorization: Bearer <token>
5. Server extracts and decodes token
6. Validates structure (3 parts, base64url)
7. Extracts user ID from 'sub' claim
8. Attaches to req.auth for downstream use
```

**Token Structure:**
```typescript
{
  sub: "user_xxx",           // User ID
  sid: "sess_xxx",           // Session ID
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe"
}
```

**Middleware:**
- `authMiddleware` - Requires valid token (401 if missing)
- `optionalAuth` - Accepts with or without token

**Team Context:**
- Fetched asynchronously after auth
- Added to `req.auth.teamId` and `req.auth.isTeamOwner`
- Feature flag gated

### 7.2 API Security

**Rate Limiting:**
```typescript
// Global: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'development'  // ⚠️ Disabled in dev
})

// Schema generation: 5 requests per minute
const schemaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
})
```

**CORS:**
```typescript
app.use(cors({
  origin: ['https://superschema.ai', 'https://www.superschema.ai'],
  credentials: true
}))
```

**Security Headers:**
```typescript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))
```

**Input Validation:**
- Zod schemas for all request bodies
- URL validation before scraping
- Parameterized queries (SQL injection prevention)
- Escaped output (XSS prevention)

**Secrets Management:**
- All secrets in environment variables
- No secrets in code/config
- Digital Ocean App Platform secret management
- AES-256-CBC for OAuth token encryption

### 7.3 Database Security

**Row Level Security (RLS):**
```sql
-- Users can only see their own data
CREATE POLICY "Users view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Team members can view team data
CREATE POLICY "Team members view team data"
ON table_name FOR SELECT
USING (team_id IN (SELECT get_user_teams(auth.uid())));
```

**Admin Access:**
```sql
CREATE FUNCTION is_admin(check_user_id TEXT) RETURNS BOOLEAN
AS $$ BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = check_user_id AND admin_privileges = true
  );
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Encryption:**
- HubSpot tokens: AES-256-CBC at rest
- Supabase: Encryption at rest (managed)
- SSL/TLS for all connections

---

## 8. Critical Code Paths

### ⚠️ HIGH CRITICALITY

**1. Schema Generation Flow**
- **Location:** `/server/src/services/schemaGenerator.ts`
- **Why Critical:** Core product, handles credits, AI processing
- **Fragile Points:**
  - Atomic credit consumption (lines 56-94)
  - AI service calls (line 138)
  - Database transaction ordering
  - Error handling affects credit refunds

**2. HubSpot OAuth Callback**
- **Location:** `/server/src/controllers/hubspotController.ts` (handleOAuthCallback)
- **Why Critical:** Complex dual-flow, 60-second code expiration
- **Fragile Points:**
  - OAuth code must be exchanged in <60 seconds (lines 31-156)
  - Marketplace-first pending connection storage
  - Token encryption errors break connections
  - State parameter validation

**3. Stripe Webhook Handler**
- **Location:** `/server/src/services/stripe.ts` (handleWebhook)
- **Why Critical:** Financial transactions, credit allocation
- **Fragile Points:**
  - Webhook signature verification (lines 111-124)
  - Duplicate event handling (idempotency)
  - Credit addition failures leave users unpaid

**4. Atomic Credit Consumption**
- **Location:** `/database/migrations/022_atomic_credit_consumption_v2.sql`
- **Why Critical:** Prevents race conditions, accurate billing
- **Fragile Points:**
  - PostgreSQL locking mechanism
  - Timeout handling
  - Fallback to legacy method

### ⚠️ MODERATE CRITICALITY

**5. Team Context Fetching**
- **Location:** `/server/src/middleware/auth.ts` (lines 84-111)
- **Why Critical:** Async in auth flow, affects all requests
- **Fragile Points:**
  - Error handling allows request to proceed without team context
  - Feature flag checks
  - Database query failures

**6. Puppeteer Web Scraping**
- **Location:** `/server/src/services/scraper.ts`
- **Why Critical:** Can crash if Chrome unavailable, resource intensive
- **Fragile Points:**
  - Browser launch failures
  - Memory leaks from unclosed pages
  - Timeout handling
  - Anti-bot detection

**7. URL Validation & Crawler Blocking**
- **Location:** `/server/src/services/urlValidator.ts`
- **Why Critical:** Pre-flight checks prevent wasted credits
- **Fragile Points:**
  - robots.txt parsing errors
  - X-Robots-Tag header detection
  - Meta tag scraping failures

### Common Patterns

**Error Handling:**
```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed context:', error)
  throw createError('User-friendly message', statusCode)
}
```

**Database Query:**
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', userId)

if (error) throw new Error(`Failed: ${error.message}`)
return data
```

**Feature Flag Check:**
```typescript
if (!FEATURE_FLAGS.TEAMS_ENABLED) {
  throw createError('Feature not available', 404)
}
```

**Team Context:**
```typescript
const teamId = req.auth?.teamId || null
const userId = req.auth!.userId

const data = teamId
  ? await db.getByTeamId(teamId)
  : await db.getByUserId(userId)
```

---

## 9. Known Issues & Tech Debt

### 9.1 TODO Comments in Code

```typescript
// server/src/services/schemaGenerator.ts:121
// TODO: Re-implement content validation with better logic
// Current: Validation skipped (too strict, blocking valid content)

// client/src/pages/SettingsPage.tsx:132
// TODO: Implement clear history API call

// client/src/pages/SettingsPage.tsx:140
// TODO: Implement account deletion with Clerk
```

### 9.2 Known Limitations

**1. Content Validation Disabled ⚠️**
- Location: `schemaGenerator.ts:120-122`
- Issue: Too strict, blocks valid pages
- Impact: May generate schemas for low-quality content
- Fix: Better content quality heuristics

**2. Manual Token Verification ⚠️ SECURITY**
- Location: `auth.ts` middleware
- Issue: No cryptographic JWT signature verification
- Risk: Potential vulnerability (low in practice with Clerk)
- Fix: Implement proper JWT verification with Clerk public keys

**3. No Rate Limiting in Development**
- Location: `index.ts` rate limiters
- Issue: Completely disabled in dev
- Impact: Can't test rate limit behavior
- Fix: Lower limits in dev, don't skip entirely

**4. Missing RLS Policies**
- Issue: Some newer tables may lack RLS
- Risk: Data exposure if service role key compromised
- Fix: Audit all tables, comprehensive RLS

**5. Pending Connection Cleanup**
- Location: Cron job in `index.ts`
- Issue: Relies on continuous cron execution
- Risk: Memory leaks if job fails
- Fix: Database-level TTL or scheduled cleanup

**6. No Webhook Retry Logic**
- Location: Stripe/Clerk webhooks
- Issue: Failed webhooks not retried
- Risk: Lost credits on processing failure
- Fix: Webhook queue with retry mechanism

**7. Missing Test Coverage ⚠️**
- Issue: Very limited tests
- Location: Only `teamService.test.ts` found
- Impact: Regressions likely
- Fix: Comprehensive test suite

### 9.3 Performance Considerations

**1. Puppeteer Memory Usage**
- Each generation launches Chrome (200-300 MB)
- No connection pooling
- Fix: Browser instance pooling

**2. N+1 Query Problems**
- Team member fetches may have N+1
- User stats calculations inefficient
- Fix: Database joins, eager loading

**3. No Caching Layer**
- Redis available but underutilized
- Repeated validations not cached
- Credit pack data fetched every request
- Fix: Redis caching for static data

**4. Large JSONB Columns**
- `schemas` column can be very large
- `scraper_diagnostics` stores full HTML
- Impact: Slow queries, large DB size
- Fix: External blob storage

**5. Unoptimized Queries**
- Missing indexes on some queries
- Full table scans
- Fix: Composite indexes, query optimization

### 9.4 Security Concerns

**1. JWT Not Verified ⚠️ HIGH PRIORITY**
- Already mentioned, worth repeating
- Fix: Implement Clerk public key verification

**2. Encryption Key Rotation**
- HubSpot tokens use static key
- No rotation mechanism
- Fix: Key versioning and rotation

**3. No Input Sanitization**
- URLs not sanitized before display
- Potential XSS in user content
- Fix: Sanitization middleware

**4. Webhook Replay Attacks**
- No timestamp validation
- Potential replay vulnerability
- Fix: Timestamp checks, nonce tracking

---

## 10. Testing & Quality

### 10.1 Testing Setup

**Vitest Configuration:**
- Test runner: Vitest 3.2.4
- UI available: `npm run test:ui`
- Coverage: `npm run test:coverage`

**Existing Tests:**
- `/server/src/services/teamService.test.ts` (30KB) - Comprehensive team tests
- No other test files found

**Commands:**
```bash
npm run test --workspace=server          # Run once
npm run test:watch --workspace=server    # Watch mode
npm run test:ui --workspace=server       # UI mode
npm run test:coverage --workspace=server # Coverage
```

### 10.2 Quality Assurance

**Pre-Deployment Checklist:**
1. `npm run build` - Clean build check
2. `npm run type-check` - TypeScript validation
3. `npm run lint` - Code quality
4. Manual testing of critical paths
5. Check Digital Ocean build logs

**Database Migration Process:**
1. Test migration in development
2. Backup production database
3. Run via Supabase SQL Editor
4. Verify data integrity
5. Monitor error logs

**Code Quality:**
- TypeScript for type safety
- Zod for runtime validation
- Async/await throughout
- Comprehensive error handling
- Detailed console logging

**Error Monitoring:**
- Errors logged to `error_logs` table
- Admin dashboard monitoring
- Console logging throughout

---

## 11. Maintenance Instructions

### 📋 FOR CLAUDE: DOCUMENT UPDATE PROTOCOL

**CRITICAL:** This document MUST be updated whenever:

1. **New Features Added:**
   - Update Section 3 (Core Features) with feature description
   - Add database tables to Section 4 if applicable
   - Add API endpoints to Section 5.3
   - Add critical code paths to Section 8 if high-risk
   - Update integration details in Section 6 if third-party involved

2. **Bug Fixes Implemented:**
   - Remove from Section 9 (Known Issues) when fixed
   - Update Critical Code Paths if fix affects fragile areas
   - Add to Tech Debt if quick fix created new issues

3. **Database Schema Changes:**
   - Update Section 4 with new tables/columns
   - Update RLS policies if changed
   - Document migration file location

4. **Third-Party Integration Changes:**
   - Update Section 6 with new flow details
   - Update environment variables in Section 2
   - Add error handling notes

5. **Deployment Configuration Changes:**
   - Update Section 2 (Infrastructure) immediately
   - Update environment variables list
   - Document new build commands

### 🎯 Before Starting ANY New Feature:

1. **Read Relevant Sections:**
   - Section 3: Understand existing features
   - Section 4: Review database schema
   - Section 8: Identify critical paths to avoid breaking

2. **Ask Clarifying Questions:**
   - Reference this document in questions
   - Confirm understanding of existing architecture
   - Validate approach against current patterns

3. **Plan with Context:**
   - Consider impact on critical code paths
   - Ensure consistency with existing patterns
   - Validate against known tech debt

### 🔍 Before Fixing ANY Bug:

1. **Check Section 9:** Is this a known issue with documented fix approach?
2. **Check Section 8:** Is the bug in a critical code path? Extra caution required!
3. **Check Section 6:** Is third-party integration involved? Review full flow.

### ✅ Update Checklist (Run After Every Change):

```markdown
- [ ] Updated relevant feature documentation in Section 3
- [ ] Added/updated database schema in Section 4
- [ ] Added/updated API endpoints in Section 5.3
- [ ] Updated critical code paths in Section 8 (if applicable)
- [ ] Removed fixed issues from Section 9
- [ ] Added new tech debt to Section 9 (if introduced)
- [ ] Updated environment variables in Section 2 (if changed)
- [ ] Updated third-party integration flows in Section 6 (if changed)
- [ ] Updated "Last Updated" date at top of document
```

### 📝 Writing Style Guidelines:

- **Be concise but complete** - Optimize for quick scanning
- **Include file paths and line numbers** - Enable fast navigation
- **Mark criticality** - Use ⚠️ for high-risk areas
- **Focus on "why"** - Not just "what", explain why it matters
- **Use code examples** - Show patterns, not just descriptions
- **Keep organized** - Consistent structure across sections

### 🚨 Critical Reminders:

1. **Digital Ocean, NOT Vercel** - We use Digital Ocean App Platform
2. **Atomic Credit Consumption** - Always use `consumeCreditsAtomic()` for new features
3. **HubSpot 60s Code Expiration** - OAuth codes MUST be exchanged immediately
4. **Feature Flags** - Check flags before using Teams features
5. **RLS Policies** - ALL new tables need RLS policies
6. **Manual JWT Verification** - Current limitation, no cryptographic validation

---

**Document Version History:**
- v1.0.0 (2025-11-18): Initial creation - Comprehensive baseline documentation

---

*This document is the single source of truth for SuperSchema architecture. Keep it current, reference it often, and update it with every change.*

---

## 🤖 CLAUDE: READ THIS BEFORE EVERY TASK

**STOP! Before proceeding with ANY feature development or bug fix:**

1. ✅ **Have you read the relevant sections of this document?**
2. ✅ **Do you understand how your changes impact existing features?**
3. ✅ **Have you identified which critical code paths (Section 8) might be affected?**
4. ✅ **Are you following the established patterns documented here?**

**AFTER completing ANY task:**

1. 📝 **UPDATE THIS DOCUMENT IMMEDIATELY** - Use the checklist in Section 11
2. 🔄 **Keep it current** - This document is only valuable if it's accurate
3. 📅 **Update the "Last Updated" date at the top**
4. 📋 **Add to version history if significant changes**

**Remember:**
- This document exists to prevent bugs, maintain consistency, and preserve architectural decisions
- Your future self (in new conversations) depends on this being accurate
- Every feature you add without updating this document makes future work harder
- The user trusts you to maintain this as a living document

**When in doubt:** Reference this document. It contains the answers to most architecture questions.

---

**END OF DOCUMENT** | Last Updated: 2025-11-18 | Keep This Current!
