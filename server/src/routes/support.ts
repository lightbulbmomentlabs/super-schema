import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  createTicket,
  getAllTickets,
  deleteTicket,
  batchDeleteTickets
} from '../controllers/supportController.js'

const router = Router()

// POST /api/support/tickets - Create ticket (authenticated users)
router.post('/tickets', authMiddleware, createTicket)

// GET /api/support/tickets - Get all tickets (admin only)
router.get('/tickets', authMiddleware, adminAuthMiddleware, getAllTickets)

// DELETE /api/support/tickets/:ticketId - Delete single ticket (admin only)
router.delete('/tickets/:ticketId', authMiddleware, adminAuthMiddleware, deleteTicket)

// POST /api/support/tickets/batch-delete - Batch delete tickets (admin only)
router.post('/tickets/batch-delete', authMiddleware, adminAuthMiddleware, batchDeleteTickets)

export default router
