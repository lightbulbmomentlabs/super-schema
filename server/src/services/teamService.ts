// IMPORTANT: Load environment variables FIRST
import '../config/env.js'

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { FEATURE_FLAGS } from '../config/featureFlags.js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// =============================================================================
// TYPES
// =============================================================================

export interface Team {
  id: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  invited_at: string
  joined_at: string
  email?: string
  first_name?: string | null
  last_name?: string | null
  is_owner?: boolean
}

export interface TeamInvite {
  id: string
  team_id: string
  invite_token: string
  created_by: string
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
}

export interface InviteValidationResult {
  valid: boolean
  teamOwnerEmail?: string
  teamOwnerFirstName?: string
  teamOwnerLastName?: string
  organizationName?: string
  teamMemberCount?: number
  expiresAt?: string
  error?: string
}

// =============================================================================
// TEAM CRUD OPERATIONS
// =============================================================================

/**
 * Create a new team with specified owner
 */
export async function createTeam(ownerId: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create team: ${error.message}`)
  }

  return data
}

/**
 * Get team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    throw new Error(`Failed to get team: ${error.message}`)
  }

  return data
}

/**
 * Get team by owner ID
 */
export async function getTeamByOwnerId(ownerId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', ownerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get team by owner: ${error.message}`)
  }

  return data
}

/**
 * Delete team (cascades to members, invites, and all team resources)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) {
    throw new Error(`Failed to delete team: ${error.message}`)
  }
}

// =============================================================================
// TEAM MEMBERSHIP OPERATIONS
// =============================================================================

/**
 * Add user to team as a member
 */
export async function addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
  // Check team size limit (10 members max)
  const memberCount = await getTeamMemberCount(teamId)
  if (memberCount >= 10) {
    throw new Error('Team has reached maximum size of 10 members')
  }

  // Add member
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - user already in team
      throw new Error('User is already a member of this team')
    }
    throw new Error(`Failed to add team member: ${error.message}`)
  }

  // Update user's active_team_id
  await updateUserActiveTeam(userId, teamId)

  return data
}

/**
 * Remove user from team
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`)
  }

  // Clear user's active_team_id
  await updateUserActiveTeam(userId, null)
}

/**
 * Get all members of a team with user details
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      user_id,
      invited_at,
      joined_at,
      users (
        email,
        first_name,
        last_name
      )
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get team members: ${error.message}`)
  }

  // Get team owner to mark them in the response
  const team = await getTeam(teamId)

  // Flatten and enrich with owner flag
  return data.map((member: any) => ({
    id: member.id,
    teamId: member.team_id,
    userId: member.user_id,
    invitedAt: member.invited_at,
    joinedAt: member.joined_at,
    email: member.users.email,
    firstName: member.users.first_name,
    lastName: member.users.last_name,
    isOwner: team?.owner_id === member.user_id,
    isActive: true
  }))
}

/**
 * Get team member count
 */
export async function getTeamMemberCount(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (error) {
    throw new Error(`Failed to get team member count: ${error.message}`)
  }

  return count || 0
}

/**
 * Check if user is a member of team
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check team membership: ${error.message}`)
  }

  return !!data
}

/**
 * Check if user is the owner of team
 */
export async function isTeamOwner(userId: string, teamId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('owner_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check team ownership: ${error.message}`)
  }

  return !!data
}

// =============================================================================
// TEAM INVITATIONS
// =============================================================================

/**
 * Generate cryptographically secure invite token
 * Creates an 8-character token using base64url encoding
 * Provides ~281 trillion possible combinations (6 bytes = 48 bits of entropy)
 */
function generateInviteToken(): string {
  // Generate 6 bytes of random data and convert to base64url (8 characters)
  return crypto
    .randomBytes(6)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Create team invitation
 */
export async function createTeamInvite(
  teamId: string,
  createdBy: string
): Promise<{ inviteToken: string; expiresAt: string; inviteUrl: string }> {
  // Check if teams feature is enabled
  if (!FEATURE_FLAGS.TEAMS_INVITES_ENABLED) {
    throw new Error('Team invitations are currently disabled')
  }

  // Verify creator is team owner
  const isOwner = await isTeamOwner(createdBy, teamId)
  if (!isOwner) {
    throw new Error('Only team owner can create invitations')
  }

  // Check team size limit
  const memberCount = await getTeamMemberCount(teamId)
  if (memberCount >= 10) {
    throw new Error('Team has reached maximum size of 10 members')
  }

  // Generate secure token
  const inviteToken = generateInviteToken()
  console.log('🎫 [CreateInvite] Generated token:', inviteToken)

  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  console.log('🎫 [CreateInvite] Inserting invite to database:', {
    teamId,
    inviteToken,
    createdBy,
    expiresAt: expiresAt.toISOString()
  })

  // Create invite record
  const { data, error } = await supabase
    .from('team_invites')
    .insert({
      team_id: teamId,
      invite_token: inviteToken,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  console.log('🎫 [CreateInvite] Database insert result:', {
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    data
  })

  if (error) {
    console.error('❌ [CreateInvite] Failed to insert invite:', error)
    throw new Error(`Failed to create team invite: ${error.message}`)
  }

  console.log('✅ [CreateInvite] Invite created successfully in database')

  // Construct invite URL
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
  const baseUrl = clientUrl.split(',')[0].trim() // Use first URL if multiple
  const inviteUrl = `${baseUrl}/team/join/${inviteToken}`

  console.log('🎫 [CreateInvite] Returning invite URL:', inviteUrl)

  return {
    inviteToken,
    expiresAt: expiresAt.toISOString(),
    inviteUrl
  }
}

/**
 * Validate invite token
 */
export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
  console.log('🔍 [ValidateInvite] Starting validation for token:', token)

  // Get invite with team and owner details
  const { data, error } = await supabase
    .from('team_invites')
    .select(`
      id,
      team_id,
      expires_at,
      used_at,
      teams!inner (
        owner_id,
        users!teams_owner_id_fkey (
          email,
          first_name,
          last_name,
          organization_name
        )
      )
    `)
    .eq('invite_token', token)
    .single()

  console.log('🔍 [ValidateInvite] Database query result:', {
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message
  })

  if (error || !data) {
    console.log('❌ [ValidateInvite] Invalid token - not found in database')
    return {
      valid: false,
      error: 'Invalid invitation token'
    }
  }

  console.log('🔍 [ValidateInvite] Invite data:', {
    id: data.id,
    teamId: data.team_id,
    expiresAt: data.expires_at,
    usedAt: data.used_at,
    hasTeamData: !!(data.teams as any)
  })

  // Check if already used
  if (data.used_at) {
    console.log('❌ [ValidateInvite] Invite already used at:', data.used_at)
    return {
      valid: false,
      error: 'This invitation has already been used'
    }
  }

  // Check if expired
  const expiresAt = new Date(data.expires_at)
  const now = new Date()
  console.log('🔍 [ValidateInvite] Expiration check:', {
    expiresAt: expiresAt.toISOString(),
    now: now.toISOString(),
    isExpired: expiresAt < now
  })

  if (expiresAt < now) {
    console.log('❌ [ValidateInvite] Invite expired')
    return {
      valid: false,
      error: 'This invitation has expired'
    }
  }

  // Check team size
  const memberCount = await getTeamMemberCount(data.team_id)
  if (memberCount >= 10) {
    return {
      valid: false,
      error: 'This team has reached maximum capacity (10 members)'
    }
  }

  // Get owner data
  const owner = (data.teams as any).users

  console.log('🔍 [ValidateInvite] Owner data structure:', {
    fullDataTeams: data.teams,
    owner,
    hasOrganizationName: !!owner?.organization_name,
    organizationName: owner?.organization_name,
    email: owner?.email,
    firstName: owner?.first_name,
    lastName: owner?.last_name
  })

  // Valid invitation
  const responseData = {
    valid: true,
    teamOwnerEmail: owner.email,
    teamOwnerFirstName: owner.first_name || undefined,
    teamOwnerLastName: owner.last_name || undefined,
    organizationName: owner.organization_name || undefined,
    teamMemberCount: memberCount,
    expiresAt: data.expires_at
  }

  console.log('🔍 [ValidateInvite] Returning response:', responseData)

  return responseData
}

/**
 * Accept team invitation (join team)
 */
export async function acceptTeamInvite(token: string, userId: string): Promise<string> {
  // Validate token
  const validation = await validateInviteToken(token)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid invitation')
  }

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('team_id')
    .eq('invite_token', token)
    .single()

  if (inviteError || !invite) {
    throw new Error('Invitation not found')
  }

  const teamId = invite.team_id

  // Check if user is already in this team
  const alreadyMember = await isTeamMember(userId, teamId)
  if (alreadyMember) {
    throw new Error('You are already a member of this team')
  }

  // Check 10-team limit
  const userTeamCount = await getUserTeamCount(userId)
  if (userTeamCount >= 10) {
    throw new Error('You have reached the maximum limit of 10 teams')
  }

  // Add user to new team (keeps existing team memberships)
  await addTeamMember(teamId, userId)

  // Mark invite as used
  await supabase
    .from('team_invites')
    .update({
      used_at: new Date().toISOString(),
      used_by: userId
    })
    .eq('invite_token', token)

  return teamId
}

/**
 * Get all invites for a team
 */
export async function getTeamInvites(teamId: string): Promise<TeamInvite[]> {
  const { data, error } = await supabase
    .from('team_invites')
    .select(`
      id,
      team_id,
      invite_token,
      created_by,
      created_at,
      expires_at,
      used_at,
      used_by,
      users:used_by (
        email,
        first_name,
        last_name
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get team invites: ${error.message}`)
  }

  return data as TeamInvite[]
}

/**
 * Delete/revoke a team invite
 * Can only delete invites that haven't been used yet
 */
export async function deleteTeamInvite(inviteId: string, userId: string): Promise<void> {
  // Get invite details to verify ownership
  const { data: invite, error: fetchError } = await supabase
    .from('team_invites')
    .select('team_id, used_at, teams!inner(owner_id)')
    .eq('id', inviteId)
    .single()

  if (fetchError || !invite) {
    throw new Error('Invitation not found')
  }

  // Verify user is team owner
  const team = invite.teams as any
  if (team.owner_id !== userId) {
    throw new Error('Only team owner can delete invitations')
  }

  // Don't allow deleting used invites
  if (invite.used_at) {
    throw new Error('Cannot delete an invitation that has already been used')
  }

  // Delete the invite
  const { error: deleteError } = await supabase
    .from('team_invites')
    .delete()
    .eq('id', inviteId)

  if (deleteError) {
    throw new Error(`Failed to delete invitation: ${deleteError.message}`)
  }
}

// =============================================================================
// RESOURCE TRANSFER
// =============================================================================

/**
 * Transfer user's resources to team
 * Called when user joins a team
 */
export async function transferUserResources(userId: string, teamId: string): Promise<void> {
  // Transfer schemas
  await supabase
    .from('schema_generations')
    .update({ team_id: teamId })
    .eq('user_id', userId)

  // Transfer URLs
  await supabase
    .from('discovered_urls')
    .update({ team_id: teamId })
    .eq('user_id', userId)

  // Transfer credit transactions
  await supabase
    .from('credit_transactions')
    .update({ team_id: teamId })
    .eq('user_id', userId)

  // Transfer domains
  await supabase
    .from('user_domains')
    .update({ team_id: teamId })
    .eq('user_id', userId)

  // Transfer HubSpot connections
  await supabase
    .from('hubspot_connections')
    .update({ team_id: teamId })
    .eq('user_id', userId)
}

// =============================================================================
// USER TEAM UTILITIES
// =============================================================================

/**
 * Update user's active team
 */
async function updateUserActiveTeam(userId: string, teamId: string | null): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ active_team_id: teamId })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user active team: ${error.message}`)
  }
}

/**
 * Get user's active team
 */
export async function getUserActiveTeam(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('active_team_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get user active team: ${error.message}`)
  }

  return data.active_team_id
}

/**
 * Initialize team for new user
 * Creates team-of-one and makes user the owner
 */
export async function initializeTeamForUser(userId: string): Promise<Team> {
  // Create team with user as owner
  const team = await createTeam(userId)

  // Add user as first member
  await addTeamMember(team.id, userId)

  return team
}

// =============================================================================
// MULTI-TEAM SUPPORT
// =============================================================================

/**
 * Get count of teams a user is part of
 */
export async function getUserTeamCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to get user team count: ${error.message}`)
  }

  return count || 0
}

/**
 * Get all teams a user is part of
 */
export async function getUserTeams(userId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      user_id,
      invited_at,
      joined_at,
      teams (
        id,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get user teams: ${error.message}`)
  }

  // Get user's active team to mark it
  const activeTeamId = await getUserActiveTeam(userId)

  // Flatten and enrich with ownership and active flags
  return data.map((member: any) => ({
    id: member.id,
    team_id: member.team_id,
    user_id: member.user_id,
    invited_at: member.invited_at,
    joined_at: member.joined_at,
    is_owner: member.teams.owner_id === userId,
    is_active: member.team_id === activeTeamId,
    team_created_at: member.teams.created_at
  }))
}

/**
 * Switch user's active team
 */
export async function switchActiveTeam(userId: string, teamId: string): Promise<void> {
  // Verify user is a member of the target team
  const isMember = await isTeamMember(userId, teamId)
  if (!isMember) {
    throw new Error('You are not a member of this team')
  }

  // Update active team
  await updateUserActiveTeam(userId, teamId)

  console.log(`✅ User ${userId} switched to team ${teamId}`)
}

// =============================================================================
// CLEANUP & MAINTENANCE
// =============================================================================

/**
 * Cleanup expired invites (should be run periodically via cron)
 */
export async function cleanupExpiredInvites(): Promise<number> {
  const { data, error } = await supabase
    .from('team_invites')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .select('id')

  if (error) {
    throw new Error(`Failed to cleanup expired invites: ${error.message}`)
  }

  return data?.length || 0
}

export default {
  // Team operations
  createTeam,
  getTeam,
  getTeamByOwnerId,
  deleteTeam,

  // Membership operations
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
  getTeamMemberCount,
  isTeamMember,
  isTeamOwner,

  // Invitation operations
  createTeamInvite,
  validateInviteToken,
  acceptTeamInvite,
  getTeamInvites,
  deleteTeamInvite,

  // Resource management
  transferUserResources,
  getUserActiveTeam,
  initializeTeamForUser,

  // Multi-team support
  getUserTeamCount,
  getUserTeams,
  switchActiveTeam,

  // Maintenance
  cleanupExpiredInvites
}
