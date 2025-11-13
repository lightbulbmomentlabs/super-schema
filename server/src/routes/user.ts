import { Router } from 'express'
import {
  getUserProfile,
  updateUserProfile,
  getUserCredits,
  getCreditTransactions,
  getUserUsage,
  getUserStats,
  initializeUser,
  addCreditsAdmin,
  getSuccessPreviewStatus,
  markSuccessPreviewSeen
} from '../controllers/userController.js'

const router = Router()

// POST /api/user/init - Initialize user account and grant welcome credits
router.post('/init', initializeUser)

// GET /api/user/profile
router.get('/profile', getUserProfile)

// PUT /api/user/profile
router.put('/profile', updateUserProfile)

// GET /api/user/credits
router.get('/credits', getUserCredits)

// GET /api/user/transactions
router.get('/transactions', getCreditTransactions)

// GET /api/user/usage
router.get('/usage', getUserUsage)

// GET /api/user/stats
router.get('/stats', getUserStats)

// GET /api/user/success-preview-status - Check if user has seen success preview
router.get('/success-preview-status', getSuccessPreviewStatus)

// POST /api/user/success-preview-seen - Mark success preview as seen
router.post('/success-preview-seen', markSuccessPreviewSeen)

// POST /api/user/add-credits - Admin endpoint to add credits (for development/testing)
router.post('/add-credits', addCreditsAdmin)

export default router