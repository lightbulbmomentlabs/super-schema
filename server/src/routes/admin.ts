import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  searchUsers,
  getAllUsers,
  getUserDetails,
  deleteUser,
  modifyUserCredits,
  getPlatformStats
} from '../controllers/adminController.js'

const router = Router()

// All admin routes require authentication + admin access
router.use(authMiddleware)
router.use(adminAuthMiddleware)

// GET /api/admin/stats - Platform statistics
router.get('/stats', getPlatformStats)

// GET /api/admin/users - Get all users (paginated)
router.get('/users', getAllUsers)

// GET /api/admin/users/search - Search users by email
router.get('/users/search', searchUsers)

// GET /api/admin/users/:userId - Get user details with activity
router.get('/users/:userId', getUserDetails)

// DELETE /api/admin/users/:userId - Delete user completely
router.delete('/users/:userId', deleteUser)

// POST /api/admin/users/credits - Modify user credits
router.post('/users/credits', modifyUserCredits)

export default router
