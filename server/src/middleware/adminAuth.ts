import { Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'
import type { AuthenticatedRequest } from './auth.js'
import { db } from '../services/database.js'

// Admin whitelist - reads from environment variable
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || 'kevinfremon@gmail.com'
  return adminEmails.split(',').map(email => email.trim().toLowerCase())
}

export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // First check if user is authenticated
    if (!req.auth?.userId) {
      throw createError('Authentication required', 401)
    }

    // Get user details from database
    const user = await db.getUser(req.auth.userId)

    if (!user) {
      throw createError('User not found', 404)
    }

    // Check if user's email is in admin whitelist
    const adminEmails = getAdminEmails()
    const userEmail = user.email.toLowerCase()

    if (!adminEmails.includes(userEmail)) {
      console.warn(`🚫 Admin access denied for user: ${userEmail}`)
      throw createError('Forbidden: Admin access required', 403)
    }

    console.log(`✅ Admin access granted for: ${userEmail}`)

    // Add admin flag to request
    req.auth.isAdmin = true

    next()
  } catch (error) {
    next(error)
  }
}
