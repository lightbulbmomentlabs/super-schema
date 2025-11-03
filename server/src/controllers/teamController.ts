import { Response, Request } from 'express'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import teamService from '../services/teamService.js'

// =============================================================================
// TEAM INVITATION HANDLERS
// =============================================================================

/**
 * POST /api/team/invite
 * Create a new team invitation link
 */
export const createInvite = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const teamId = req.auth!.teamId!

    console.log('📨 [TeamController] Creating invite:', { userId, teamId })

    // Create invitation
    const invite = await teamService.createTeamInvite(teamId, userId)

    res.json({
      success: true,
      data: {
        inviteToken: invite.inviteToken,
        inviteUrl: invite.inviteUrl,
        expiresAt: invite.expiresAt
      },
      message: 'Invitation created successfully'
    })
  }
)

/**
 * GET /api/team/invite/:token
 * Validate an invitation token and get team details
 * Public endpoint
 */
export const validateInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params

  if (!token) {
    throw createError('Invitation token is required', 400)
  }

  console.log('🔍 [TeamController] Validating invite:', { token: token.substring(0, 10) + '...' })

  // Validate token
  const validation = await teamService.validateInviteToken(token)

  if (!validation.valid) {
    return res.status(410).json({
      success: false,
      error: validation.error || 'Invalid or expired invitation'
    })
  }

  res.json({
    success: true,
    data: {
      valid: true,
      teamOwnerEmail: validation.teamOwnerEmail,
      teamOwnerFirstName: validation.teamOwnerFirstName,
      teamOwnerLastName: validation.teamOwnerLastName,
      organizationName: validation.organizationName,
      teamMemberCount: validation.teamMemberCount,
      expiresAt: validation.expiresAt
    }
  })
})

/**
 * POST /api/team/join/:token
 * Accept a team invitation and join the team
 */
export const joinTeam = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.params
  const userId = req.auth!.userId

  if (!token) {
    throw createError('Invitation token is required', 400)
  }

  console.log('🤝 [TeamController] User joining team:', { userId, token: token.substring(0, 10) + '...' })

  try {
    // Accept invitation and join team
    const teamId = await teamService.acceptTeamInvite(token, userId)

    res.json({
      success: true,
      data: {
        teamId
      },
      message: 'Successfully joined team'
    })
  } catch (error) {
    if (error instanceof Error) {
      // Specific error messages from team service
      if (error.message.includes('already a member')) {
        return res.status(409).json({
          success: false,
          error: error.message
        })
      }
      if (error.message.includes('maximum capacity')) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }
    }
    throw error
  }
})

/**
 * GET /api/team/invites
 * Get all invites for the current team
 */
export const getInvites = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.auth!.teamId!
    const userId = req.auth!.userId

    console.log('📋 [TeamController] Fetching team invites:', { teamId, userId })

    // Get team invites
    const invites = await teamService.getTeamInvites(teamId)

    res.json({
      success: true,
      data: invites
    })
  }
)

/**
 * DELETE /api/team/invite/:inviteId
 * Delete/revoke a team invitation
 */
export const deleteInvite = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { inviteId } = req.params
    const userId = req.auth!.userId

    if (!inviteId) {
      throw createError('Invite ID is required', 400)
    }

    console.log('🗑️ [TeamController] Deleting invite:', { inviteId, userId })

    await teamService.deleteTeamInvite(inviteId, userId)

    res.json({
      success: true,
      message: 'Invitation deleted successfully'
    })
  }
)

// =============================================================================
// TEAM MEMBERSHIP HANDLERS
// =============================================================================

/**
 * GET /api/team/members
 * Get all members of the user's team
 */
export const getMembers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.auth!.teamId!
    const userId = req.auth!.userId

    console.log('👥 [TeamController] Fetching team members:', { teamId, userId })

    // Get team members
    const members = await teamService.getTeamMembers(teamId)

    // Get team details
    const team = await teamService.getTeam(teamId)

    res.json({
      success: true,
      data: {
        members,
        teamId,
        ownerId: team?.owner_id
      }
    })
  }
)

/**
 * DELETE /api/team/members/:userId
 * Remove a member from the team
 */
export const removeMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId: targetUserId } = req.params
    const teamId = req.auth!.teamId!
    const currentUserId = req.auth!.userId
    const isOwner = req.auth!.isTeamOwner

    if (!targetUserId) {
      throw createError('User ID is required', 400)
    }

    console.log('🚫 [TeamController] Removing team member:', {
      teamId,
      currentUserId,
      targetUserId,
      isOwner
    })

    // Verify target user is actually in the team
    const isMember = await teamService.isTeamMember(targetUserId, teamId)
    if (!isMember) {
      throw createError('User is not a member of this team', 404)
    }

    // Remove member
    await teamService.removeTeamMember(teamId, targetUserId)

    res.json({
      success: true,
      message: 'Member removed successfully'
    })
  }
)

/**
 * POST /api/team/leave
 * Leave the current team (members only, not owner)
 */
export const leaveTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const teamId = req.auth!.teamId!
    const isOwner = req.auth!.isTeamOwner

    console.log('🚪 [TeamController] User leaving team:', { userId, teamId, isOwner })

    // Prevent owner from leaving (must delete account instead)
    if (isOwner) {
      throw createError(
        'Team owner cannot leave. To leave, you must delete the entire team.',
        403
      )
    }

    // Remove user from team
    await teamService.removeTeamMember(teamId, userId)

    res.json({
      success: true,
      message: 'Successfully left team'
    })
  }
)

// =============================================================================
// MULTI-TEAM HANDLERS
// =============================================================================

/**
 * GET /api/team/list
 * Get all teams the user is part of
 */
export const listTeams = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId

    console.log('📋 [TeamController] Listing teams for user:', { userId })

    // Get all teams user is part of
    const teams = await teamService.getUserTeams(userId)

    res.json({
      success: true,
      data: {
        teams,
        count: teams.length
      }
    })
  }
)

/**
 * POST /api/team/switch/:teamId
 * Switch to a different team
 */
export const switchTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { teamId } = req.params

    if (!teamId) {
      throw createError('Team ID is required', 400)
    }

    console.log('🔄 [TeamController] Switching team:', { userId, teamId })

    // Switch active team
    await teamService.switchActiveTeam(userId, teamId)

    res.json({
      success: true,
      message: 'Successfully switched team',
      data: {
        activeTeamId: teamId
      }
    })
  }
)

/**
 * GET /api/team/current
 * Get current active team details
 * Auto-creates a team if user doesn't have one yet
 */
export const getCurrentTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    let teamId = req.auth!.teamId

    // If user doesn't have a team yet, create one automatically
    if (!teamId) {
      console.log('🆕 [TeamController] User has no team, creating one:', { userId })

      // Create new team with user as owner
      const newTeam = await teamService.createTeam(userId)

      // Add user as team member
      await teamService.addTeamMember(newTeam.id, userId)

      // Set as user's active team
      await teamService.switchActiveTeam(userId, newTeam.id)

      teamId = newTeam.id

      console.log('✅ [TeamController] Team created successfully:', { userId, teamId })
    }

    console.log('ℹ️ [TeamController] Getting current team:', { userId, teamId })

    // Get team details
    const team = await teamService.getTeam(teamId)
    if (!team) {
      throw createError('Team not found', 404)
    }

    // Get team members
    const members = await teamService.getTeamMembers(teamId)

    // Check if user is the owner
    const isOwner = team.owner_id === userId

    res.json({
      success: true,
      data: {
        team,
        members,
        isOwner
      }
    })
  }
)

export default {
  createInvite,
  validateInvite,
  joinTeam,
  getMembers,
  removeMember,
  leaveTeam,
  listTeams,
  switchTeam,
  getCurrentTeam
}
