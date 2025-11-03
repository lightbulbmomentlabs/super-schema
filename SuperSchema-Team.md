# Team Shared Account Feature Requirements Document
## SuperSchema - AEO Schema Generator

**Version:** 1.0  
**Last Updated:** October 29, 2025  
**Feature Owner:** Kevin

---

## 1. Overview

### Purpose
Enable SuperSchema account owners to invite team members to share a single account, allowing collaborative schema generation with shared credits and URL library access.

### Goals
- Simplify team collaboration without complex role management
- Share credits across team members efficiently
- Maintain single source of truth for generated schemas
- Provide simple account ownership and member management

### Non-Goals
- Complex role-based permissions (admin, editor, viewer, etc.)
- Team billing or separate credit pools per member
- Transactional email notifications
- Team member activity audit logs (future feature)

---

## 2. User Roles & Permissions

### Account Owner
**Definition:** The original account creator who holds primary control

**Permissions:**
- ✅ Generate schemas
- ✅ Purchase credits
- ✅ Use credits
- ✅ View all URLs in library
- ✅ Delete any URL from library
- ✅ Invite team members
- ✅ Remove any team member
- ✅ Delete entire account
- ✅ View team member list

### Team Member
**Definition:** Invited user who has accepted invitation and joined the account

**Permissions:**
- ✅ Generate schemas
- ✅ Purchase credits
- ✅ Use credits
- ✅ View all URLs in library
- ✅ Delete any URL from library
- ✅ Remove themselves from the account
- ❌ Invite other team members
- ❌ Remove other team members
- ❌ Delete the account

---

## 3. Database Schema Changes

### New Tables

#### `teams`
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `team_members`
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

#### `team_invites`
```sql
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Modified Tables

#### `users` (or existing user table)
```sql
ALTER TABLE users ADD COLUMN active_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
```

#### `credits` (or existing credit tracking table)
```sql
ALTER TABLE credits ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
-- Note: Credits are now associated with teams, not individual users
```

#### `generated_schemas` (or URL library table)
```sql
ALTER TABLE generated_schemas ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
-- Note: URLs/schemas are now owned by teams, not individual users
```

---

## 4. User Interface Components

### 4.1 Settings Page - Team Section

**Location:** `/settings` page, new "Team" section

**For Account Owners:**

```
┌─────────────────────────────────────────────────────────┐
│ Team Management                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ You are the owner of this account                      │
│                                                         │
│ [Invite Team Member]                                    │
│                                                         │
│ Team Members (3)                                        │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 👤 John Doe                                       │  │
│ │    john@example.com                               │  │
│ │    Joined: Oct 15, 2025                    [Remove]│  │
│ └───────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 👤 Jane Smith                                     │  │
│ │    jane@example.com                               │  │
│ │    Joined: Oct 20, 2025                    [Remove]│  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**For Team Members:**

```
┌─────────────────────────────────────────────────────────┐
│ Team Management                                         │
├─────────────────────────────────────────────────────────────┤
│                                                         │
│ You are a member of this team                          │
│ Owner: owner@example.com                               │
│                                                         │
│ [Leave Team]                                            │
│                                                         │
│ Team Members (3)                                        │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 👤 Owner Name (Owner)                             │  │
│ │    owner@example.com                              │  │
│ │    Account created: Oct 1, 2025                   │  │
│ └───────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 👤 John Doe                                       │  │
│ │    john@example.com                               │  │
│ │    Joined: Oct 15, 2025                           │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Invite Modal

**Triggered by:** "Invite Team Member" button

**Modal Content:**

```
┌─────────────────────────────────────────────────────────┐
│ Invite Team Member                                 [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Share this link with your team member:                 │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ https://superschema.com/join/abc123xyz789       │   │
│ │                                        [Copy Link]│   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ This link will expire in 7 days                        │
│                                                         │
│                                         [Close]         │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Join Team Page

**URL:** `/join/:inviteToken`

**For Non-Authenticated Users:**

```
┌─────────────────────────────────────────────────────────┐
│                    SuperSchema                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ You've been invited to join a team!                    │
│                                                         │
│ Create an account to get started:                      │
│                                                         │
│              [Sign Up with Google]                      │
│              [Sign Up with Email]                       │
│                                                         │
│ Already have an account? [Sign In]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**For Authenticated Users:**

```
┌─────────────────────────────────────────────────────────┐
│                    SuperSchema                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ You've been invited to join a team!                    │
│                                                         │
│ Team Owner: owner@example.com                          │
│                                                         │
│ By joining, you will:                                  │
│ • Share credits with the team                          │
│ • Access all team URLs and schemas                     │
│ • Collaborate on schema generation                     │
│                                                         │
│              [Join Team]         [Decline]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. User Flows

### 5.1 Flow: Owner Invites Team Member

**Preconditions:** User is logged in and is the account owner

**Steps:**
1. Owner navigates to `/settings`
2. Owner clicks "Invite Team Member" button
3. System generates unique invite token with 7-day expiration
4. System displays invite modal with shareable link
5. Owner copies link and shares externally (email, Slack, etc.)
6. System stores invite in `team_invites` table

**Postconditions:** 
- Invite token created and stored
- Owner has link to share

### 5.2 Flow: Invitee Accepts Invitation (New User)

**Preconditions:** Invitee receives invite link

**Steps:**
1. Invitee clicks invite link → redirects to `/join/:inviteToken`
2. System validates invite token (not expired, not used)
3. Invitee sees "Create Account" page with invite context
4. Invitee creates account via Clerk authentication
5. After successful authentication, system:
   - Creates user account
   - Creates team record if doesn't exist
   - Adds user to `team_members` table
   - Marks invite as used in `team_invites` table
   - Sets user's `active_team_id` to the team
6. System redirects to dashboard with team access

**Postconditions:**
- User account created
- User added to team
- User has access to team resources
- Invite marked as used

### 5.3 Flow: Invitee Accepts Invitation (Existing User)

**Preconditions:** Invitee has existing SuperSchema account

**Steps:**
1. Invitee clicks invite link → redirects to `/join/:inviteToken`
2. System validates invite token
3. Invitee is already authenticated → sees "Join Team" confirmation page
4. Invitee clicks "Join Team"
5. System displays warning modal:
   ```
   Important: Joining this team will:
   • Move your personal URLs/schemas to this team account
   • Share your remaining credits with the team
   • Give all team members access to your data
   
   [Cancel] [Confirm & Join Team]
   ```
6. After confirmation, system:
   - Adds user to `team_members` table
   - Transfers user's URLs/schemas to team
   - Transfers user's credits to team
   - Sets user's `active_team_id` to the team
   - Marks invite as used
7. System redirects to dashboard

**Postconditions:**
- Existing user joined team
- User's data migrated to team
- User has access to all team resources

### 5.4 Flow: Owner Removes Team Member

**Preconditions:** User is account owner

**Steps:**
1. Owner navigates to `/settings` → Team section
2. Owner clicks "Remove" next to team member name
3. System displays confirmation modal:
   ```
   Remove [Member Name] from team?
   
   They will lose access to all team URLs, schemas, and credits.
   
   [Cancel] [Remove Member]
   ```
4. Owner confirms removal
5. System:
   - Removes user from `team_members` table
   - Sets user's `active_team_id` to NULL
   - Does NOT delete user's Clerk account
6. System displays success message
7. Removed member is redirected to onboarding/new account setup on next login

**Postconditions:**
- Member removed from team
- Member loses team access
- Member retains their user account

### 5.5 Flow: Team Member Leaves Team

**Preconditions:** User is a team member (not owner)

**Steps:**
1. Member navigates to `/settings` → Team section
2. Member clicks "Leave Team" button
3. System displays confirmation modal:
   ```
   Leave this team?
   
   You will lose access to all team URLs, schemas, and shared credits.
   You can create a new personal account after leaving.
   
   [Cancel] [Leave Team]
   ```
4. Member confirms
5. System:
   - Removes user from `team_members` table
   - Sets user's `active_team_id` to NULL
6. System redirects to onboarding/new account setup

**Postconditions:**
- Member removed from team
- Member starts fresh with new personal account

### 5.6 Flow: Owner Deletes Account

**Preconditions:** User is account owner

**Steps:**
1. Owner navigates to `/settings` → Account section
2. Owner clicks "Delete Account" button
3. System displays critical warning modal:
   ```
   Delete Account?
   
   WARNING: This will permanently delete:
   • All team URLs and schemas
   • All team credits
   • Remove all team members
   • Delete your account
   
   This action cannot be undone.
   
   Type "DELETE" to confirm:
   [_____________]
   
   [Cancel] [Delete Account]
   ```
4. Owner types "DELETE" and confirms
5. System:
   - Removes all team members from `team_members` table
   - Sets all members' `active_team_id` to NULL
   - Deletes all team data (URLs, schemas, credits)
   - Deletes team record
   - Deletes owner's Clerk account
6. System logs out owner and all team members
7. Team members see notification on next login about account deletion

**Postconditions:**
- Team completely deleted
- All members lose access
- Owner account deleted
- All team data permanently removed

---

## 6. Edge Cases & Error Handling

### 6.1 Invalid or Expired Invite Token

**Scenario:** User clicks invite link with expired or invalid token

**Behavior:**
- Display error page: "This invitation link is invalid or has expired. Please request a new invitation from your team owner."
- Provide link to homepage
- Do not create account

### 6.2 Invite Already Used

**Scenario:** Invite link is clicked after already being used

**Behavior:**
- Display message: "This invitation has already been used."
- If user is authenticated and already member → redirect to dashboard
- If user is not member → display "Contact team owner for a new invitation"

### 6.3 Owner Tries to Remove Themselves

**Scenario:** Account owner attempts to remove themselves from team

**Behavior:**
- Display error: "As the account owner, you cannot remove yourself. To leave, you must delete the entire account or transfer ownership (future feature)."
- Disable "Remove" button for owner in UI

### 6.4 User Already Member of Another Team

**Scenario:** User with existing team membership tries to join new team

**Behavior:**
- Display warning modal:
  ```
  You're already a member of another team.
  
  Joining this team will remove you from your current team.
  
  Current team: [Current Team Owner Email]
  New team: [New Team Owner Email]
  
  [Cancel] [Switch Teams]
  ```
- If confirmed, remove from current team and join new team

### 6.5 Maximum Team Size Limit

**Scenario:** Team reaches maximum member limit (suggested: 10 members)

**Behavior:**
- Disable "Invite Team Member" button
- Display message: "You've reached the maximum team size (10 members). Remove a member to invite someone new."
- Invite links return error if team is full

### 6.6 Owner Purchases Credits While Members Active

**Scenario:** Owner or member purchases credits

**Behavior:**
- Credits added to team pool
- All team members immediately see updated credit balance
- No special notification needed

### 6.7 Team Member Deleted Their Clerk Account

**Scenario:** Team member deletes their Clerk account externally

**Behavior:**
- Supabase cascade delete removes team_member record
- Team list automatically updated on next load
- No special handling needed (Clerk webhook handles cleanup)

### 6.8 Last Team Member Leaves (Owner Deleted Account)

**Scenario:** All members leave after owner deleted account

**Behavior:**
- Each member creates new personal account on next login
- No orphaned team data (cascade deletes handle cleanup)

### 6.9 Concurrent Invite Usage

**Scenario:** Multiple users try to use same invite link simultaneously

**Behavior:**
- Database UNIQUE constraint on `(team_id, user_id)` prevents duplicates
- First successful join marks invite as used
- Subsequent attempts see "invite already used" error

### 6.10 User Navigates Away During Join Process

**Scenario:** User starts join flow but doesn't complete authentication

**Behavior:**
- Invite remains valid (not marked as used)
- User can return to invite link and complete process
- If invite expires before completion, show expired error

---

## 7. API Endpoints

### 7.1 Generate Invite Link

**Endpoint:** `POST /api/team/invite`

**Authentication:** Required (must be account owner)

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "inviteToken": "abc123xyz789",
  "inviteUrl": "https://superschema.com/join/abc123xyz789",
  "expiresAt": "2025-11-05T12:00:00Z"
}
```

**Errors:**
- `403`: User is not account owner
- `400`: Team size limit reached

### 7.2 Validate Invite Token

**Endpoint:** `GET /api/team/invite/:token`

**Authentication:** Optional

**Response:**
```json
{
  "valid": true,
  "teamOwner": "owner@example.com",
  "expiresAt": "2025-11-05T12:00:00Z",
  "teamMemberCount": 3
}
```

**Errors:**
- `404`: Token not found
- `410`: Token expired or already used

### 7.3 Accept Team Invitation

**Endpoint:** `POST /api/team/join/:token`

**Authentication:** Required

**Request:**
```json
{
  "confirmTransfer": true
}
```

**Response:**
```json
{
  "success": true,
  "teamId": "uuid-here",
  "message": "Successfully joined team"
}
```

**Errors:**
- `404`: Invalid token
- `410`: Token expired or used
- `409`: User already in this team
- `400`: Team full

### 7.4 Get Team Members

**Endpoint:** `GET /api/team/members`

**Authentication:** Required (must be team member)

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "email": "owner@example.com",
      "name": "Owner Name",
      "isOwner": true,
      "joinedAt": "2025-10-01T12:00:00Z"
    },
    {
      "id": "uuid",
      "email": "member@example.com",
      "name": "Member Name",
      "isOwner": false,
      "joinedAt": "2025-10-15T12:00:00Z"
    }
  ],
  "teamId": "uuid",
  "ownerId": "uuid"
}
```

### 7.5 Remove Team Member

**Endpoint:** `DELETE /api/team/members/:userId`

**Authentication:** Required (must be owner OR removing self)

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Errors:**
- `403`: Not authorized (non-owner trying to remove others)
- `400`: Cannot remove owner (must delete account)
- `404`: User not found in team

### 7.6 Leave Team

**Endpoint:** `POST /api/team/leave`

**Authentication:** Required (must be team member, not owner)

**Response:**
```json
{
  "success": true,
  "message": "Successfully left team"
}
```

**Errors:**
- `403`: Owner cannot leave (must delete account)
- `404`: User not in any team

---

## 8. Security Considerations

### 8.1 Invite Token Security

- **Token Generation:** Use cryptographically secure random tokens (min 32 characters)
- **Expiration:** 7-day expiration prevents indefinite access
- **Single Use:** Tokens marked as used prevent replay attacks
- **No Sensitive Data:** Tokens don't encode team/user data, only reference database

### 8.2 Authorization Checks

**Every team-related action must verify:**
1. User is authenticated (Clerk session)
2. User is member of the team they're accessing
3. User has appropriate role (owner vs member) for the action

**Example Middleware:**
```javascript
async function requireTeamMember(req, res, next) {
  const { userId } = req.auth;
  const { teamId } = req.user;
  
  const isMember = await checkTeamMembership(userId, teamId);
  if (!isMember) {
    return res.status(403).json({ error: 'Not a team member' });
  }
  next();
}

async function requireTeamOwner(req, res, next) {
  const { userId } = req.auth;
  const { teamId } = req.user;
  
  const isOwner = await checkTeamOwnership(userId, teamId);
  if (!isOwner) {
    return res.status(403).json({ error: 'Must be team owner' });
  }
  next();
}
```

### 8.3 Data Isolation

- **Row Level Security (RLS):** Implement Supabase RLS policies to enforce team data isolation
- **Query Scoping:** All queries must filter by `team_id` or `active_team_id`
- **Prevent Leakage:** Never expose team data across teams in API responses

**Example RLS Policies:**
```sql
-- Users can only see schemas from their team
CREATE POLICY "Team members can view team schemas"
ON generated_schemas FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can only modify schemas from their team
CREATE POLICY "Team members can modify team schemas"
ON generated_schemas FOR ALL
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);
```

### 8.4 Credit Protection

- **Atomic Operations:** Credit deduction must be atomic to prevent race conditions
- **Team-Level Locking:** Prevent concurrent credit usage issues
- **Validation:** Always check credit balance before schema generation

---

## 9. Testing Requirements

### 9.1 Unit Tests

**Authentication & Authorization:**
- ✅ Only owner can generate invite links
- ✅ Only owner can remove other members
- ✅ Members can remove themselves
- ✅ Owner cannot remove themselves
- ✅ Non-team members cannot access team data

**Invite Token Logic:**
- ✅ Token expires after 7 days
- ✅ Token can only be used once
- ✅ Invalid tokens return appropriate errors
- ✅ Token validates team is not full

**Credit System:**
- ✅ Credits shared across team
- ✅ Credit deduction is atomic
- ✅ Credit balance updates for all members

### 9.2 Integration Tests

**Complete User Flows:**
- ✅ Owner invites → new user joins → accesses team data
- ✅ Owner invites → existing user joins → data merged
- ✅ Owner removes member → member loses access
- ✅ Member leaves team → member loses access
- ✅ Owner deletes account → all members lose access

**Edge Cases:**
- ✅ Multiple users use same invite simultaneously
- ✅ User joins while already in another team
- ✅ Team reaches max size during invite acceptance
- ✅ Invite expires during join process

### 9.3 Security Tests

**Authorization:**
- ✅ Members cannot access other teams' data
- ✅ Non-members cannot access team endpoints
- ✅ RLS policies enforce data isolation

**Token Security:**
- ✅ Tokens cannot be brute-forced
- ✅ Expired tokens always rejected
- ✅ Used tokens cannot be reused

---

## 10. Implementation Checklist

### Phase 1: Database & Backend
- [ ] Create database schema (teams, team_members, team_invites)
- [ ] Implement RLS policies for team data isolation
- [ ] Migrate existing user data to team structure
- [ ] Create API endpoints for team operations
- [ ] Implement invite token generation and validation
- [ ] Add authorization middleware for team routes

### Phase 2: Frontend UI
- [ ] Add Team section to Settings page
- [ ] Build Invite Modal component
- [ ] Create Join Team page (/join/:token)
- [ ] Add team member list display
- [ ] Implement remove member confirmation modal
- [ ] Add leave team confirmation modal
- [ ] Update delete account flow for team owners

### Phase 3: User Flows
- [ ] Implement complete invite flow
- [ ] Implement join team flow (new users)
- [ ] Implement join team flow (existing users)
- [ ] Implement remove member flow
- [ ] Implement leave team flow
- [ ] Handle account deletion with team cleanup

### Phase 4: Testing & Polish
- [ ] Write unit tests for all API endpoints
- [ ] Write integration tests for complete flows
- [ ] Test all edge cases
- [ ] Security audit and penetration testing
- [ ] Performance testing with multiple concurrent users
- [ ] UI/UX polish and responsive design

### Phase 5: Deployment
- [ ] Deploy database migrations to production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for errors and issues
- [ ] Document feature for users (help docs)

---

## 11. Future Enhancements (Out of Scope)

The following features are explicitly out of scope for the initial implementation but may be considered in future iterations:

- **Ownership Transfer:** Allow owner to transfer ownership to another member
- **Granular Roles:** Admin, Editor, Viewer permission levels
- **Team Activity Log:** Audit trail of all team actions
- **Email Notifications:** Automated emails for invites, removals, etc.
- **Team Name & Branding:** Custom team names and profile pictures
- **Multiple Teams per User:** Allow users to be members of multiple teams simultaneously
- **API Access Tokens:** Team-level API keys for integrations
- **Usage Analytics:** Per-member usage tracking and reporting
- **Team Billing:** Separate payment methods and billing management
- **Invite Expiration Settings:** Customizable invite expiration periods

---

## 12. Open Questions for Development

1. **Team Size Limit:** Should we enforce a maximum team size? Suggested: 10 members for MVP
2. **Invite Expiration:** Is 7 days appropriate or should it be configurable?
3. **Data Migration:** What happens to a user's existing URLs/credits when they join a team? (Recommendation: Transfer to team)
4. **Team Naming:** Do teams need names or just identified by owner? (Recommendation: No names for simplicity)
5. **Analytics:** Should we track team usage metrics? (Recommendation: Basic tracking only)

---

## 13. Success Metrics

**Adoption Metrics:**
- % of accounts that enable team feature
- Average team size
- Team feature retention rate

**Engagement Metrics:**
- Schemas generated per team vs solo accounts
- Credit usage per team vs solo accounts
- Team feature usage frequency

**Technical Metrics:**
- API response times for team operations
- Error rates on team-related endpoints
- Invite acceptance rate

---

## Appendix A: Example Database Queries

### Check if User is Team Owner
```sql
SELECT EXISTS (
  SELECT 1 FROM teams 
  WHERE id = $teamId AND owner_id = $userId
);
```

### Get User's Team Members
```sql
SELECT u.id, u.email, u.name,
  (t.owner_id = u.id) as is_owner,
  tm.joined_at
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE tm.team_id = $teamId
ORDER BY is_owner DESC, tm.joined_at ASC;
```

### Validate Invite Token
```sql
SELECT ti.*, t.owner_id
FROM team_invites ti
JOIN teams t ON t.id = ti.team_id
WHERE ti.invite_token = $token
  AND ti.used_at IS NULL
  AND ti.expires_at > NOW();
```

### Get Team Credit Balance
```sql
SELECT SUM(amount) as total_credits
FROM credits
WHERE team_id = $teamId;
```

---

**End of Feature Requirements Document**