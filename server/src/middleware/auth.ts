import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'
import { getUserActiveTeam, isTeamOwner } from '../services/teamService.js'
import { FEATURE_FLAGS } from '../config/featureFlags.js'

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string
    sessionId: string
    isAdmin?: boolean
    email?: string
    firstName?: string
    lastName?: string
    teamId?: string | null
    isTeamOwner?: boolean
  }
  userId?: string
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('🔐 [Auth] Processing request:', {
    url: req.url,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  })

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⚠️ [Auth] Missing or invalid authorization header:', {
      hasAuthHeader: !!authHeader,
      headerPrefix: authHeader?.substring(0, 10)
    })
    return next(createError('Authentication required', 401))
  }

  // Extract the token
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Decode JWT token (Clerk JWT structure)
    // For now, we'll decode without verification for development
    // In production, you should verify the signature with Clerk's public key
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('❌ [Auth] Token does not have 3 parts:', {
        parts: parts.length,
        tokenPreview: token.substring(0, 20) + '...'
      })
      return next(createError('Invalid token format', 401))
    }

    // Decode the payload (base64url decode)
    // JWT uses base64url encoding, which is slightly different from standard base64
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

    // Clerk tokens have 'sub' field which is the user ID
    if (!payload.sub) {
      console.error('❌ [Auth] Token payload missing "sub" field:', {
        payloadKeys: Object.keys(payload)
      })
      return next(createError('Invalid token payload', 401))
    }

    console.log('✅ [Auth] Token decoded successfully:', {
      userId: payload.sub,
      email: payload.email || payload.primary_email_address_id,
      hasSession: !!payload.sid
    })

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid || 'unknown-session',
      email: payload.email || payload.primary_email_address_id,
      firstName: payload.first_name || payload.given_name,
      lastName: payload.last_name || payload.family_name
    }

    // Also set userId directly on request for backward compatibility
    req.userId = payload.sub

    // Fetch team context if teams feature is enabled
    if (FEATURE_FLAGS.TEAMS_ENABLED || FEATURE_FLAGS.TEAMS_MIGRATION_COMPLETE) {
      getUserActiveTeam(payload.sub)
        .then(async (teamId) => {
          if (req.auth && teamId) {
            req.auth.teamId = teamId
            // Check if user is team owner
            req.auth.isTeamOwner = await isTeamOwner(payload.sub, teamId)
            console.log('🏢 [Auth] Team context added:', {
              userId: payload.sub,
              teamId,
              isTeamOwner: req.auth.isTeamOwner
            })
          }
          next()
        })
        .catch((error) => {
          console.warn('⚠️ [Auth] Failed to fetch team context:', {
            userId: payload.sub,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          // Continue without team context (backward compatibility)
          next()
        })
    } else {
      // Teams feature disabled, continue without team context
      next()
    }
  } catch (error) {
    console.error('❌ [Auth] Failed to decode token:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenPreview: token.substring(0, 20) + '...'
    })
    return next(createError('Invalid token', 401))
  }
}

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Optional authentication - doesn't fail if no auth provided
  console.log('🔓 [Auth] Processing optional auth:', {
    url: req.url,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization
  })

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔓 [Auth] No auth header, continuing without authentication')
    return next()
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Decode JWT token (same logic as authMiddleware)
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('⚠️ [Auth] Invalid token format, continuing without auth')
      return next()
    }

    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

    if (payload.sub) {
      console.log('✅ [Auth] Optional auth decoded successfully:', {
        userId: payload.sub,
        email: payload.email || payload.primary_email_address_id
      })

      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid || 'unknown-session',
        email: payload.email || payload.primary_email_address_id,
        firstName: payload.first_name || payload.given_name,
        lastName: payload.last_name || payload.family_name
      }
      req.userId = payload.sub

      // Fetch team context if teams feature is enabled
      if (FEATURE_FLAGS.TEAMS_ENABLED || FEATURE_FLAGS.TEAMS_MIGRATION_COMPLETE) {
        getUserActiveTeam(payload.sub)
          .then(async (teamId) => {
            if (req.auth && teamId) {
              req.auth.teamId = teamId
              req.auth.isTeamOwner = await isTeamOwner(payload.sub, teamId)
            }
            next()
          })
          .catch((error) => {
            console.warn('⚠️ [Auth] Failed to fetch team context:', error)
            next()
          })
      } else {
        next()
      }
    } else {
      console.warn('⚠️ [Auth] Token missing "sub" field, continuing without auth')
      next()
    }
  } catch (error) {
    console.warn('⚠️ [Auth] Failed to decode optional auth token:', error)
    // Continue without auth instead of failing
    next()
  }
}