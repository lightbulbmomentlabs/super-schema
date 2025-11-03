import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.js'
import { createError } from './errorHandler.js'
import { FEATURE_FLAGS, isTeamsEnabledForUser } from '../config/featureFlags.js'

/**
 * Middleware to ensure teams feature is enabled
 * Returns 404 if teams feature is disabled (feature doesn't exist)
 */
export const requireTeamsEnabled = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!FEATURE_FLAGS.TEAMS_ENABLED) {
    console.warn('⚠️ [TeamAuth] Teams feature is disabled')
    return next(createError('Feature not available', 404))
  }

  // Check beta user access if beta list is active
  if (!req.auth?.userId) {
    return next(createError('Authentication required', 401))
  }

  if (!isTeamsEnabledForUser(req.auth.userId)) {
    console.warn('⚠️ [TeamAuth] Teams feature not enabled for user:', req.auth.userId)
    return next(createError('Feature not available for your account', 403))
  }

  next()
}

/**
 * Middleware to ensure user has a team assigned
 * Should be used after authMiddleware and requireTeamsEnabled
 */
export const requireTeamContext = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(createError('Authentication required', 401))
  }

  if (!req.auth.teamId) {
    console.error('❌ [TeamAuth] User has no active team:', {
      userId: req.auth.userId
    })
    return next(createError('No active team. Please contact support.', 400))
  }

  console.log('✅ [TeamAuth] Team context verified:', {
    userId: req.auth.userId,
    teamId: req.auth.teamId
  })

  next()
}

/**
 * Middleware to ensure user is a member of their team
 * Provides extra security layer beyond just having team_id
 */
export const requireTeamMember = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || !req.auth.teamId) {
    return next(createError('Team context required', 400))
  }

  // If we got here with team context from authMiddleware, user is a member
  // (authMiddleware only sets teamId if user is in team_members table)
  console.log('✅ [TeamAuth] Team member verified:', {
    userId: req.auth.userId,
    teamId: req.auth.teamId
  })

  next()
}

/**
 * Middleware to ensure user is the owner of their team
 * Use this for privileged operations like inviting members or deleting team
 */
export const requireTeamOwner = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || !req.auth.teamId) {
    return next(createError('Team context required', 400))
  }

  if (!req.auth.isTeamOwner) {
    console.warn('⚠️ [TeamAuth] User is not team owner:', {
      userId: req.auth.userId,
      teamId: req.auth.teamId
    })
    return next(createError('Only team owner can perform this action', 403))
  }

  console.log('✅ [TeamAuth] Team owner verified:', {
    userId: req.auth.userId,
    teamId: req.auth.teamId
  })

  next()
}

/**
 * Middleware to allow action if user is team owner OR performing action on themselves
 * Useful for endpoints like removing team members (owner can remove anyone, member can remove self)
 */
export const requireTeamOwnerOrSelf = (targetUserIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || !req.auth.teamId) {
      return next(createError('Team context required', 400))
    }

    const targetUserId = req.params[targetUserIdParam] || req.body[targetUserIdParam]

    // Allow if user is team owner
    if (req.auth.isTeamOwner) {
      console.log('✅ [TeamAuth] Action allowed: user is team owner')
      return next()
    }

    // Allow if user is performing action on themselves
    if (req.auth.userId === targetUserId) {
      console.log('✅ [TeamAuth] Action allowed: user acting on self')
      return next()
    }

    console.warn('⚠️ [TeamAuth] Unauthorized action:', {
      userId: req.auth.userId,
      targetUserId,
      isTeamOwner: req.auth.isTeamOwner
    })

    return next(createError('Not authorized to perform this action', 403))
  }
}

/**
 * Middleware to prevent team owner from removing themselves
 * Team owner must delete the entire team instead
 */
export const preventOwnerRemoveSelf = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || !req.auth.teamId) {
    return next(createError('Team context required', 400))
  }

  const targetUserId = req.params.userId || req.body.userId

  // If user is owner and trying to remove themselves, block it
  if (req.auth.isTeamOwner && req.auth.userId === targetUserId) {
    console.warn('⚠️ [TeamAuth] Team owner cannot remove themselves:', {
      userId: req.auth.userId
    })
    return next(
      createError(
        'Team owner cannot remove themselves. To leave, you must delete the entire team.',
        400
      )
    )
  }

  next()
}

/**
 * Middleware chain for standard team member operations
 * Use this for most team endpoints that require membership
 */
export const requireTeamMemberAccess = [
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember
]

/**
 * Middleware chain for team owner operations
 * Use this for privileged endpoints like invitations and member management
 */
export const requireTeamOwnerAccess = [
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner
]

export default {
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  requireTeamOwner,
  requireTeamOwnerOrSelf,
  preventOwnerRemoveSelf,
  requireTeamMemberAccess,
  requireTeamOwnerAccess
}
