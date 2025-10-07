import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string
    sessionId: string
    isAdmin?: boolean
    email?: string
    firstName?: string
    lastName?: string
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

    next()
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
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next()
  }

  if (authHeader.startsWith('Bearer ')) {
    req.auth = {
      userId: 'mock-user-id',
      sessionId: 'mock-session-id'
    }
  }

  next()
}