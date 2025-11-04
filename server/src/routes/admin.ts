import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  searchUsers,
  getAllUsers,
  getUserDetails,
  deleteUser,
  modifyUserCredits,
  getPlatformStats,
  adminHealthCheck,
  getErrorLogs,
  getErrorLog,
  updateErrorLogStatus,
  getErrorStats,
  getHubSpotStats,
  getSchemaFailures,
  getSchemaFailureStats
} from '../controllers/adminController.js'

const router = Router()

// All admin routes require authentication + admin access
router.use(authMiddleware)
router.use(adminAuthMiddleware)

// GET /api/admin/health - Health check for admin access
router.get('/health', adminHealthCheck)

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

// Error Logging Routes

// GET /api/admin/errors - Get error logs with pagination and filtering
router.get('/errors', getErrorLogs)

// GET /api/admin/errors/stats - Get error statistics
router.get('/errors/stats', getErrorStats)

// GET /api/admin/errors/:id - Get single error log
router.get('/errors/:id', getErrorLog)

// PATCH /api/admin/errors/:id/status - Update error log status
router.patch('/errors/:id/status', updateErrorLogStatus)

// HubSpot Integration Monitoring

// GET /api/admin/hubspot/stats - Get HubSpot connection statistics
router.get('/hubspot/stats', getHubSpotStats)

// Schema Generation Failure Tracking (Phase 1: Enhanced Failure Tracking)

// GET /api/admin/schema-failures - Get schema generation failures with filtering
router.get('/schema-failures', getSchemaFailures)

// GET /api/admin/schema-failures/stats - Get aggregated failure statistics
router.get('/schema-failures/stats', getSchemaFailureStats)

export default router
