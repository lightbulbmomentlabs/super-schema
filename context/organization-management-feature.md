# Organization Management Feature

> **Status**: Planning Complete - Ready for Implementation
> **Created**: 2024-11-28
> **Plan File**: `/Users/kevinfremon/.claude/plans/prancy-waddling-whale.md`

---

## Quick Reference

### Problem
Users receive validation warnings when generating schemas:
- `publisher.address: Businesses should have address information`
- `publisher.contact: Businesses should have contact information`

### Solution
Allow users to create organizations with complete schema.org data that auto-populates into generated schemas based on domain matching.

### Key Decisions
| Decision | Choice |
|----------|--------|
| Navigation | Expand Settings page with "Organizations" section |
| Data Model | Separate `organizations` table (not extend teams) |
| Multi-org | Yes - support multiple orgs per team (agency use case) |
| Auto-fill | Silent injection + "Publisher: Name" badge |

---

## Implementation Checklist

### Phase 1: Database & Backend Foundation ✅ COMPLETE
- [x] Create migration `database/migrations/034_organizations_table.sql`
- [x] Add types to `shared/src/types/index.ts`
- [x] Create `server/src/services/organizationService.ts`
- [x] Create `server/src/controllers/organizationController.ts`
- [x] Create `server/src/routes/organization.ts`
- [x] Register routes in `server/src/index.ts`

### Phase 2: Frontend Core UI
- [ ] Create `client/src/components/OrganizationCard.tsx`
- [ ] Create `client/src/components/OrganizationForm.tsx`
- [ ] Create `client/src/components/OrganizationCompletenessBar.tsx`
- [ ] Add Organizations section to `client/src/pages/SettingsPage.tsx`
- [ ] Add organization API methods to `client/src/services/api.ts`
- [ ] Create organization state management (context or hooks)

### Phase 3: Schema Generation Integration
- [ ] Modify `server/src/services/schemaGenerator.ts` to fetch org and inject publisher
- [ ] Update AI prompts in `server/src/services/openai.ts`
- [ ] Update AI prompts in `server/src/services/anthropic.ts`
- [ ] Return publisher info in generation response
- [ ] Show publisher badge in Generate page results

### Phase 4: Polish & Migration
- [ ] Migrate existing `users.organization_name` to organizations table
- [ ] Add completeness scoring logic
- [ ] Add onboarding prompts for empty state
- [ ] Domain conflict detection UI

---

## Database Schema

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Core schema.org properties
    name TEXT NOT NULL,
    url TEXT,
    logo_url TEXT,

    -- PostalAddress
    street_address TEXT,
    address_locality TEXT,      -- city
    address_region TEXT,        -- state/province
    postal_code TEXT,
    address_country TEXT,

    -- Contact
    telephone TEXT,
    email TEXT,

    -- Social profiles (sameAs)
    same_as JSONB DEFAULT '[]',

    -- Domain associations
    associated_domains JSONB DEFAULT '[]',

    -- Metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_team_id ON organizations(team_id);
CREATE INDEX idx_organizations_domains ON organizations USING GIN (associated_domains);
```

---

## TypeScript Types

```typescript
// Add to shared/src/types/index.ts

export interface OrganizationAddress {
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

export interface Organization {
  id: string
  teamId: string
  name: string
  url?: string
  logoUrl?: string
  address?: OrganizationAddress
  telephone?: string
  email?: string
  sameAs?: string[]
  associatedDomains?: string[]
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationRequest {
  name: string
  url?: string
  logoUrl?: string
  address?: OrganizationAddress
  telephone?: string
  email?: string
  sameAs?: string[]
  associatedDomains?: string[]
  isDefault?: boolean
}

export interface UpdateOrganizationRequest extends Partial<CreateOrganizationRequest> {}

export interface OrganizationCompleteness {
  score: number
  missingFields: string[]
  filledFields: string[]
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List team's organizations |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get single organization |
| PUT | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete (soft delete) |
| POST | `/api/organizations/:id/default` | Set as default |
| GET | `/api/organizations/for-domain?domain=X` | Get org for domain matching |

---

## UI Components

### Organization Card
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Acme Corporation                    [Edit] [⋮] │
│         acme.com, shop.acme.com                        │
│         ██████████░░ 85% complete                      │
│         ⚠ Missing: Email                               │
└─────────────────────────────────────────────────────────┘
```

### Organization Form (Progressive Disclosure)
- **Section 1: Basic Info** (always expanded) - Name, URL, Logo
- **Section 2: Address** (collapsed) - Full PostalAddress fields
- **Section 3: Contact** (collapsed) - Phone, Email
- **Section 4: Social** (collapsed) - sameAs URLs
- **Section 5: Domains** (collapsed) - Associated domains list

---

## Domain Matching Logic

Priority order:
1. **Exact match**: `acme.com` matches URLs from `acme.com`
2. **Wildcard subdomain**: `*.acme.com` matches `blog.acme.com`, `www.acme.com`
3. **Default fallback**: Use team's default organization if no match

---

## Schema Generation Integration

### Flow
1. User enters URL to generate schema
2. Extract domain from URL
3. Query `find_organization_for_domain(team_id, domain)`
4. Build publisher JSON-LD object from organization data
5. Pass to AI with instruction to use provided publisher
6. Return `publisherUsed: { id, name }` in response
7. Show badge: "Publisher: Acme Corp" in UI

### AI Prompt Addition
```
If PUBLISHER_DATA is provided below, use it exactly as the "publisher"
property in the generated schema. Do not modify or invent publisher information.

PUBLISHER_DATA:
{JSON of publisher object}
```

---

## Critical Files Reference

| File | Purpose |
|------|---------|
| `database/migrations/034_organizations_table.sql` | New migration |
| `shared/src/types/index.ts` | Add Organization types |
| `server/src/services/organizationService.ts` | New service |
| `server/src/controllers/organizationController.ts` | New controller |
| `server/src/routes/organization.ts` | New routes |
| `server/src/routes/index.ts` | Register routes |
| `server/src/services/schemaGenerator.ts` | Inject publisher data |
| `server/src/services/openai.ts` | Update prompt |
| `server/src/services/anthropic.ts` | Update prompt |
| `client/src/pages/SettingsPage.tsx` | Add Organizations section |
| `client/src/services/api.ts` | Add API methods |

---

## Existing Patterns to Follow

- **Service pattern**: See `server/src/services/teamService.ts`
- **Controller pattern**: See `server/src/controllers/teamController.ts`
- **Routes pattern**: See `server/src/routes/team.ts`
- **Settings UI pattern**: See card sections in `client/src/pages/SettingsPage.tsx`
- **Domain association pattern**: See `database/migrations/010_hubspot_domain_associations.sql`

---

## Success Criteria

1. ✅ Users can create/edit/delete organizations with full schema.org data
2. ✅ Users can associate multiple domains with each organization
3. ✅ Schema generation silently auto-fills publisher from matched organization
4. ✅ Validation warnings for `publisher.address` and `publisher.contact` resolved
5. ✅ Settings page shows clear organization management UI
6. ✅ Agencies can manage multiple client organizations

---

## Notes

- The existing `users.organization_name` column should be migrated to organizations table
- First organization created becomes the default
- Only team owners can manage organizations (following team permissions pattern)
- Use JSONB for `same_as` and `associated_domains` for flexibility
