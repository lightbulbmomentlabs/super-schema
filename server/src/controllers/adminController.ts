import { Response } from 'express'
import { db } from '../services/database.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { z } from 'zod'

// Validation schemas
const searchUsersSchema = z.object({
  query: z.string().min(1)
})

const deleteUserSchema = z.object({
  userId: z.string().min(1)
})

const modifyCreditsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().min(1)
})

const toggleAdminStatusSchema = z.object({
  userId: z.string().min(1),
  isAdmin: z.boolean()
})

// Health check endpoint for admin access verification
export const adminHealthCheck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log('✅ [AdminController] Health check passed for user:', req.auth?.userId)

  res.json({
    success: true,
    data: {
      message: 'Admin access verified',
      userId: req.auth?.userId,
      isAdmin: req.auth?.isAdmin,
      timestamp: new Date().toISOString()
    }
  })
})

export const searchUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query } = searchUsersSchema.parse(req.query)

  const users = await db.searchUsersByEmail(query)

  res.json({
    success: true,
    data: users
  })
})

export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0

  const users = await db.getAllUsers(limit, offset)

  res.json({
    success: true,
    data: users
  })
})

export const getUserDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params

  const user = await db.getUser(userId)

  if (!user) {
    throw createError('User not found', 404)
  }

  // Get user activity
  const activity = await db.getUserActivity(userId, 20)

  // Get user stats
  const stats = await db.getUserStats(userId)

  res.json({
    success: true,
    data: {
      user,
      activity,
      stats
    }
  })
})

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = deleteUserSchema.parse(req.params)

  // Check if user exists
  const user = await db.getUser(userId)
  if (!user) {
    throw createError('User not found', 404)
  }

  // Delete user completely
  await db.deleteUserCompletely(userId)

  res.json({
    success: true,
    message: `User ${user.email} deleted completely with all associated data`
  })
})

export const modifyUserCredits = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, amount, reason } = modifyCreditsSchema.parse(req.body)

  // Check if user exists
  const user = await db.getUser(userId)
  if (!user) {
    throw createError('User not found', 404)
  }

  // Add or subtract credits
  if (amount > 0) {
    await db.addCredits(userId, amount, reason)
  } else if (amount < 0) {
    await db.deductCredits(userId, Math.abs(amount), reason)
  }

  // Get updated user
  const updatedUser = await db.getUser(userId)

  res.json({
    success: true,
    data: updatedUser,
    message: `Credits ${amount > 0 ? 'added' : 'deducted'} successfully`
  })
})

export const toggleAdminStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, isAdmin } = toggleAdminStatusSchema.parse(req.body)

  // Security check: Only super admin can toggle admin status
  const currentUserId = req.auth?.userId
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }

  // Get the super admin IDs from environment
  const getAdminUserIds = (): string[] => {
    const defaultAdminIds = 'user_33hfeOP0UYLcyLEkfcCdITEYY6W,user_33Fdrdz4hyXRWshiOjEsVOGmbTv'
    const adminUserIds = process.env.ADMIN_USER_IDS || defaultAdminIds
    return adminUserIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
  }

  const superAdminIds = getAdminUserIds()

  // Only super admins can toggle admin status
  if (!superAdminIds.includes(currentUserId)) {
    throw createError('Forbidden: Only super admins can manage admin privileges', 403)
  }

  // Prevent super admin from removing their own admin status (prevent lockout)
  if (userId === currentUserId && !isAdmin) {
    throw createError('Cannot remove your own admin privileges', 400)
  }

  // Check if target user exists
  const user = await db.getUser(userId)
  if (!user) {
    throw createError('User not found', 404)
  }

  console.log(`🔐 [AdminController] ${isAdmin ? 'Granting' : 'Revoking'} admin privileges:`, {
    targetUser: user.email,
    targetUserId: userId,
    grantedBy: currentUserId
  })

  // Update admin status
  const updatedUser = await db.updateUserAdminStatus(userId, isAdmin)

  res.json({
    success: true,
    data: updatedUser,
    message: `Admin privileges ${isAdmin ? 'granted to' : 'revoked from'} ${user.email}`
  })
})

export const getPlatformStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await db.getPlatformStats()

  res.json({
    success: true,
    data: stats
  })
})

// Error Logging Admin Endpoints

/**
 * Get error logs with pagination and filtering
 */
export const getErrorLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { errorLogger } = await import('../services/errorLogger.js')

  const limit = parseInt(req.query.limit as string) || 100
  const offset = parseInt(req.query.offset as string) || 0
  const status = req.query.status as 'open' | 'investigating' | 'resolved' | 'ignored' | undefined
  const userId = req.query.userId as string | undefined
  const errorType = req.query.errorType as string | undefined
  const startDate = req.query.startDate as string | undefined
  const endDate = req.query.endDate as string | undefined

  const result = await errorLogger.getErrors({
    limit,
    offset,
    status,
    userId,
    errorType,
    startDate,
    endDate
  })

  res.json({
    success: true,
    data: result.errors,
    total: result.total,
    limit,
    offset
  })
})

/**
 * Get a single error log by ID
 */
export const getErrorLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { errorLogger } = await import('../services/errorLogger.js')
  const { id } = req.params

  const error = await errorLogger.getError(id)

  if (!error) {
    throw createError('Error log not found', 404)
  }

  res.json({
    success: true,
    data: error
  })
})

/**
 * Update error log status
 */
export const updateErrorLogStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { errorLogger } = await import('../services/errorLogger.js')
  const { id } = req.params
  const { status, resolutionNotes } = req.body

  // Validate status
  const validStatuses = ['open', 'investigating', 'resolved', 'ignored']
  if (!validStatuses.includes(status)) {
    throw createError('Invalid status. Must be one of: open, investigating, resolved, ignored', 400)
  }

  const success = await errorLogger.updateErrorStatus(
    id,
    status,
    req.auth?.email || req.auth?.userId,
    resolutionNotes
  )

  if (!success) {
    throw createError('Failed to update error log status', 500)
  }

  res.json({
    success: true,
    message: `Error log status updated to ${status}`
  })
})

/**
 * Get error statistics
 */
export const getErrorStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { errorLogger } = await import('../services/errorLogger.js')
  const timeframe = (req.query.timeframe as '24h' | '7d' | '30d') || '24h'

  const stats = await errorLogger.getErrorStats(timeframe)

  res.json({
    success: true,
    data: stats,
    timeframe
  })
})

/**
 * Get AI API health metrics
 * Tracks 529 errors, success rates, response times, and hourly trends
 * Used by admin dashboard to monitor AI service health
 */
export const getApiHealthMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { errorLogger } = await import('../services/errorLogger.js')

  const metrics = await errorLogger.getApiHealthMetrics()

  res.json({
    success: true,
    data: metrics
  })
})

/**
 * Get HubSpot connection statistics
 * Helps monitor the HubSpot integration health, especially for regional API support
 */
export const getHubSpotStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await db.getHubSpotStats()

  res.json({
    success: true,
    data: stats
  })
})

/**
 * Get schema generation failures with filtering and pagination
 * Part of Phase 1: Enhanced Failure Tracking
 */
export const getSchemaFailures = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    failureReason,
    failureStage,
    userId,
    startDate,
    endDate
  } = req.query

  const result = await db.getSchemaFailures({
    page: Number(page),
    limit: Number(limit),
    failureReason: failureReason as string,
    failureStage: failureStage as string,
    userId: userId as string,
    startDate: startDate as string,
    endDate: endDate as string
  })

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get aggregated schema failure statistics
 * Part of Phase 1: Enhanced Failure Tracking
 */
export const getSchemaFailureStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query

  const stats = await db.getSchemaFailureStats({
    startDate: startDate as string,
    endDate: endDate as string
  })

  res.json({
    success: true,
    data: stats
  })
})

/**
 * Delete a schema failure record (hard delete)
 * Allows admins to remove investigated failures from the list
 */
export const deleteSchemaFailure = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  if (!id) {
    throw createError('Failure ID is required', 400)
  }

  await db.deleteSchemaFailure(id)

  res.json({
    success: true,
    message: 'Schema failure deleted successfully'
  })
})
