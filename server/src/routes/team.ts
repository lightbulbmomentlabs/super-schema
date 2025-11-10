import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  requireTeamsEnabled,
  requireTeamOwner,
  requireTeamMember,
  requireTeamOwnerOrSelf,
  preventOwnerRemoveSelf,
  requireTeamContext
} from '../middleware/teamAuth.js'
import {
  createInvite,
  validateInvite,
  joinTeam,
  getInvites,
  deleteInvite,
  getMembers,
  removeMember,
  leaveTeam,
  listTeams,
  switchTeam,
  getCurrentTeam,
  createNewTeam
} from '../controllers/teamController.js'

const router = Router()

// =============================================================================
// TEAM INVITATION ROUTES
// =============================================================================

/**
 * POST /api/team/invite
 * Create a new team invitation link
 * Requires: Team owner
 */
router.post(
  '/invite',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  createInvite
)

/**
 * GET /api/team/invite/:token
 * Validate an invitation token and get team details
 * Public endpoint (no auth required)
 */
router.get('/invite/:token', validateInvite)

/**
 * POST /api/team/join/:token
 * Accept a team invitation and join the team
 * Requires: Authentication only (invite provides team context)
 */
router.post('/join/:token', authMiddleware, joinTeam)

/**
 * GET /api/team/invites
 * Get all invites for the current team
 * Requires: Team member
 */
router.get(
  '/invites',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  getInvites
)

/**
 * DELETE /api/team/invite/:inviteId
 * Delete/revoke a team invitation
 * Requires: Team owner
 */
router.delete(
  '/invite/:inviteId',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  deleteInvite
)

// =============================================================================
// TEAM MEMBERSHIP ROUTES
// =============================================================================

/**
 * GET /api/team/members
 * Get all members of the user's team
 * Requires: Team member
 */
router.get(
  '/members',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  getMembers
)

/**
 * DELETE /api/team/members/:userId
 * Remove a member from the team
 * Requires: Team owner OR user removing themselves
 */
router.delete(
  '/members/:userId',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  preventOwnerRemoveSelf,
  requireTeamOwnerOrSelf('userId'),
  removeMember
)

/**
 * POST /api/team/leave
 * Leave the current team (members only, not owner)
 * Requires: Team member (not owner)
 */
router.post(
  '/leave',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  leaveTeam
)

// =============================================================================
// MULTI-TEAM ROUTES
// =============================================================================

/**
 * GET /api/team/list
 * Get all teams the user is part of
 * Requires: Authentication
 */
router.get('/list', authMiddleware, requireTeamsEnabled, listTeams)

/**
 * POST /api/team/create
 * Create a new team for the current user
 * User remains in their current team and can switch later
 * Grants 2 free credits to the new team
 * Requires: Authentication
 */
router.post('/create', authMiddleware, requireTeamsEnabled, createNewTeam)

/**
 * POST /api/team/switch/:teamId
 * Switch to a different team
 * Requires: Authentication (verified member in service)
 */
router.post('/switch/:teamId', authMiddleware, requireTeamsEnabled, switchTeam)

/**
 * GET /api/team/current
 * Get current active team details
 * Auto-creates a team if user doesn't have one
 * Requires: Authentication only
 */
router.get(
  '/current',
  authMiddleware,
  requireTeamsEnabled,
  getCurrentTeam
)

export default router
