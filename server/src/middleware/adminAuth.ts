import { Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'
import type { AuthenticatedRequest } from './auth.js'
import { db } from '../services/database.js'

// Admin whitelist - reads from environment variable
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || 'kevinfremon@gmail.com'
  return adminEmails.split(',').map(email => email.trim().toLowerCase())
}

// Admin user IDs - for cases where user might not be in DB yet or has multiple accounts
const getAdminUserIds = (): string[] => {
  // Fallback to hardcoded admin IDs if env var not set (temporary until DO applies config)
  const defaultAdminIds = 'user_33hfeOP0UYLcyLEkfcCdITEYY6W,user_33Fdrdz4hyXRWshiOjEsVOGmbTv'
  const adminUserIds = process.env.ADMIN_USER_IDS || defaultAdminIds
  return adminUserIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
}

export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 [AdminAuth] Checking admin access:', {
      url: req.url,
      method: req.method,
      hasAuth: !!req.auth,
      userId: req.auth?.userId,
      timestamp: new Date().toISOString()
    })

    // First check if user is authenticated
    if (!req.auth?.userId) {
      console.error('❌ [AdminAuth] No auth object or userId found')
      throw createError('Authentication required', 401)
    }

    // Check if userId is directly whitelisted (bypasses DB check)
    const adminUserIds = getAdminUserIds()
    if (adminUserIds.includes(req.auth.userId)) {
      console.log(`✅ [AdminAuth] Admin access GRANTED via userId whitelist:`, req.auth.userId)
      req.auth.isAdmin = true
      return next()
    }

    // Get user details from database
    const user = await db.getUser(req.auth.userId)

    if (!user) {
      console.error('❌ [AdminAuth] User not found in database:', req.auth.userId)
      throw createError('User not found', 404)
    }

    console.log('👤 [AdminAuth] User found:', {
      userId: user.id,
      email: user.email
    })

    // Check if user's email is in admin whitelist
    const adminEmails = getAdminEmails()
    const userEmail = user.email.toLowerCase()

    console.log('📋 [AdminAuth] Checking whitelist:', {
      userEmail,
      adminEmails,
      isInWhitelist: adminEmails.includes(userEmail)
    })

    if (!adminEmails.includes(userEmail)) {
      console.warn(`🚫 [AdminAuth] Admin access DENIED for user: ${userEmail}`)
      throw createError('Forbidden: Admin access required', 403)
    }

    console.log(`✅ [AdminAuth] Admin access GRANTED for: ${userEmail}`)

    // Add admin flag to request
    req.auth.isAdmin = true

    next()
  } catch (error) {
    console.error('❌ [AdminAuth] Error in middleware:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    next(error)
  }
}
