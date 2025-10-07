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

export const getPlatformStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await db.getPlatformStats()

  res.json({
    success: true,
    data: stats
  })
})
