import { Response } from 'express'
import { db } from '../services/database.js'
import { hubspotCRM } from '../services/hubspotCRM.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { userProfileUpdateSchema, paginationSchema } from 'aeo-schema-generator-shared/schemas'
import { z } from 'zod'
import teamService from '../services/teamService.js'
import { FEATURE_FLAGS } from '../config/featureFlags.js'

const userInitSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

export const getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  const user = await db.getUser(userId)

  if (!user) {
    throw createError('User not found', 404)
  }

  res.json({
    success: true,
    data: user
  })
})

export const updateUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate request body
  const validatedData = userProfileUpdateSchema.parse(req.body)

  const updatedUser = await db.updateUser(userId, validatedData)

  // Sync update to HubSpot CRM (non-blocking, best effort)
  if (updatedUser.email) {
    hubspotCRM.createOrUpdateContact({
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName
    }).catch(error => {
      // Log error but don't fail profile update
      console.error('Failed to sync profile update to HubSpot CRM:', error)
    })
  }

  // Track usage
  await db.trackUsage(
    userId,
    'login', // Using login as profile update event
    { action: 'profile_update', fields: Object.keys(validatedData) },
    req.ip,
    req.get('User-Agent')
  )

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  })
})

export const getUserCredits = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  const user = await db.getUser(userId)

  if (!user) {
    throw createError('User not found', 404)
  }

  res.json({
    success: true,
    data: {
      creditBalance: user.creditBalance,
      totalCreditsUsed: user.totalCreditsUsed
    }
  })
})

export const getCreditTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate query parameters
  const { page, limit } = paginationSchema.parse(req.query)

  const transactions = await db.getCreditTransactions(userId, page, limit)

  res.json({
    success: true,
    data: transactions
  })
})

export const getUserUsage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate query parameters
  const { page, limit } = paginationSchema.parse(req.query)

  const schemaGenerations = await db.getSchemaGenerations(userId, page, limit)

  res.json({
    success: true,
    data: schemaGenerations
  })
})

export const getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  const stats = await db.getUserStats(userId)

  if (!stats) {
    throw createError('User statistics not found', 404)
  }

  res.json({
    success: true,
    data: stats
  })
})

export const initializeUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, firstName, lastName } = userInitSchema.parse(req.body)

  // Use the auth userId if available, otherwise use email as a fallback for development
  const userId = req.auth?.userId || `user_${email.replace('@', '_').replace(/\./g, '_')}`

  console.log('🔧 [INIT USER] Starting user initialization:', {
    userId,
    email,
    firstName,
    lastName,
    hasAuth: !!req.auth
  })

  try {
    // Check if user already exists
    let user = await db.getUser(userId)
    console.log('🔧 [INIT USER] User lookup result:', {
      userId,
      userExists: !!user,
      currentBalance: user?.creditBalance
    })

    if (!user) {
      console.log('🔧 [INIT USER] Creating NEW user and granting welcome credits...')

      // Create new user and grant welcome credits
      await db.upsertUserFromClerk(userId, email, firstName, lastName)
      console.log('🔧 [INIT USER] User created via upsertUserFromClerk')

      // Add welcome bonus credits (only for new users)
      const creditResult = await db.addCredits(
        userId,
        2,
        'Welcome bonus - 2 free credits for new users'
      )
      console.log('🔧 [INIT USER] Welcome credits added:', creditResult)

      // Track signup analytics
      await db.trackUsage(
        userId,
        'signup',
        {
          source: 'user_init_endpoint',
          email,
          firstName,
          lastName
        }
      )
      console.log('🔧 [INIT USER] Signup analytics tracked')

      // Initialize team for new user (team-of-one model)
      // Only create team if teams migration has been completed
      if (FEATURE_FLAGS.TEAMS_MIGRATION_COMPLETE) {
        try {
          console.log('🔧 [INIT USER] Initializing team for new user...')
          const team = await teamService.initializeTeamForUser(userId)
          console.log('🔧 [INIT USER] Team created:', {
            teamId: team.id,
            ownerId: team.owner_id
          })
        } catch (error) {
          // Log error but don't fail user initialization
          console.error('❌ [INIT USER] Failed to create team:', error)
          console.warn('⚠️ [INIT USER] User created without team - may need manual intervention')
        }
      } else {
        console.log('🔧 [INIT USER] Skipping team creation (migration not complete)')
      }

      // Get the updated user with credits
      user = await db.getUser(userId)
      console.log('🔧 [INIT USER] Final user state:', {
        userId,
        creditBalance: user?.creditBalance,
        totalCreditsUsed: user?.totalCreditsUsed
      })

      res.json({
        success: true,
        data: user,
        message: 'Account initialized successfully! You have received 2 free credits.'
      })
    } else {
      console.log('🔧 [INIT USER] User already exists, checking if they need welcome credits...')

      // Check if this is an existing user who never received welcome credits
      // (They have 0 credits AND have never used any credits)
      const needsWelcomeCredits = user.creditBalance === 0 && user.totalCreditsUsed === 0

      console.log('🔧 [INIT USER] Welcome credits check:', {
        creditBalance: user.creditBalance,
        totalCreditsUsed: user.totalCreditsUsed,
        needsWelcomeCredits
      })

      if (needsWelcomeCredits) {
        console.log('🔧 [INIT USER] Granting welcome credits to existing user who never received them...')

        // Add welcome bonus credits
        const creditResult = await db.addCredits(
          userId,
          2,
          'Welcome bonus - 2 free credits (retroactive grant)'
        )
        console.log('🔧 [INIT USER] Retroactive welcome credits added:', creditResult)

        // Get the updated user with credits
        user = await db.getUser(userId)
        console.log('🔧 [INIT USER] Final user state after retroactive grant:', {
          userId,
          creditBalance: user?.creditBalance,
          totalCreditsUsed: user?.totalCreditsUsed
        })

        res.json({
          success: true,
          data: user,
          message: 'Welcome! You have received 2 free credits to get started.'
        })
      } else {
        console.log('🔧 [INIT USER] User already has credits or has used the app, returning profile')
        // User already exists and has credits or has used the app
        res.json({
          success: true,
          data: user,
          message: 'Welcome back!'
        })
      }
    }
  } catch (error) {
    console.error('❌ [INIT USER] Error initializing user:', error)
    throw createError('Failed to initialize user account', 500)
  }
})

// Admin endpoint to add credits (for development/testing)
export const addCreditsAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  const { amount, description } = req.body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw createError('Invalid amount. Must be a positive number.', 400)
  }

  if (amount > 100) {
    throw createError('Maximum 100 credits can be added at once.', 400)
  }

  try {
    await db.addCredits(
      userId,
      amount,
      description || `Admin credit addition - ${amount} credits for testing`
    )

    // Get updated user
    const user = await db.getUser(userId)

    res.json({
      success: true,
      data: user,
      message: `Successfully added ${amount} credits. New balance: ${user?.creditBalance || 0}`
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    throw createError('Failed to add credits', 500)
  }
})