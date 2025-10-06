import { Response } from 'express'
import { db } from '../services/database.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { z } from 'zod'

// Validation schemas
const createTicketSchema = z.object({
  category: z.enum(['general', 'feature_request', 'bug_report']),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

const deleteTicketsSchema = z.object({
  ticketIds: z.array(z.string()).min(1, 'At least one ticket ID required')
})

export const createTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, message } = createTicketSchema.parse(req.body)

  const userId = req.auth!.userId

  // Try to get user info from database first, fallback to token data
  let userEmail = req.auth!.email || 'no-email@provided.com'
  let userName = 'Unknown User'

  try {
    const user = await db.getUser(userId)
    if (user) {
      userEmail = user.email
      userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || userName
    } else {
      // User not in database yet, use token data
      const firstName = req.auth!.firstName || ''
      const lastName = req.auth!.lastName || ''
      userName = `${firstName} ${lastName}`.trim() || userName
    }
  } catch (error) {
    // If database fetch fails, use token data
    const firstName = req.auth!.firstName || ''
    const lastName = req.auth!.lastName || ''
    userName = `${firstName} ${lastName}`.trim() || userName
  }

  const ticket = await db.createSupportTicket(
    userId,
    userEmail,
    userName,
    category,
    message
  )

  res.json({
    success: true,
    data: ticket,
    message: 'Support ticket created successfully'
  })
})

export const getAllTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tickets = await db.getSupportTickets()

  res.json({
    success: true,
    data: tickets
  })
})

export const deleteTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ticketId } = req.params

  await db.deleteSupportTicket(ticketId)

  res.json({
    success: true,
    message: 'Support ticket deleted successfully'
  })
})

export const batchDeleteTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ticketIds } = deleteTicketsSchema.parse(req.body)

  await db.deleteSupportTickets(ticketIds)

  res.json({
    success: true,
    message: `${ticketIds.length} support ticket(s) deleted successfully`
  })
})
