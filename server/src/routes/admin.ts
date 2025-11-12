import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  searchUsers,
  getAllUsers,
  getUserDetails,
  deleteUser,
  modifyUserCredits,
  toggleAdminStatus,
  getPlatformStats,
  adminHealthCheck,
  getErrorLogs,
  getErrorLog,
  updateErrorLogStatus,
  getErrorStats,
  getApiHealthMetrics,
  getHubSpotStats,
  getSchemaFailures,
  getSchemaFailureStats,
  deleteSchemaFailure,
  getHubSpotCRMDiagnostics,
  testHubSpotCRMContact,
  backfillHubSpotCRM,
  getPowerUsersAnalytics,
  getSchemaQualityAnalytics,
  getConversionAnalytics
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

// PATCH /api/admin/users/admin-status - Toggle admin status
router.patch('/users/admin-status', toggleAdminStatus)

// Error Logging Routes

// GET /api/admin/errors - Get error logs with pagination and filtering
router.get('/errors', getErrorLogs)

// GET /api/admin/errors/stats - Get error statistics
router.get('/errors/stats', getErrorStats)

// GET /api/admin/errors/:id - Get single error log
router.get('/errors/:id', getErrorLog)

// PATCH /api/admin/errors/:id/status - Update error log status
router.patch('/errors/:id/status', updateErrorLogStatus)

// AI API Health Monitoring

// GET /api/admin/api-health - Get AI API health metrics (529 errors, success rates, trends)
router.get('/api-health', getApiHealthMetrics)

// HubSpot Integration Monitoring

// GET /api/admin/hubspot/stats - Get HubSpot connection statistics
router.get('/hubspot/stats', getHubSpotStats)

// GET /api/admin/hubspot-crm/diagnostics - Get HubSpot CRM integration diagnostics
router.get('/hubspot-crm/diagnostics', getHubSpotCRMDiagnostics)

// POST /api/admin/hubspot-crm/test - Test HubSpot CRM contact creation
router.post('/hubspot-crm/test', testHubSpotCRMContact)

// POST /api/admin/hubspot-crm/backfill - Backfill existing users to HubSpot CRM
router.post('/hubspot-crm/backfill', backfillHubSpotCRM)

// Schema Generation Failure Tracking (Phase 1: Enhanced Failure Tracking)

// GET /api/admin/schema-failures - Get schema generation failures with filtering
router.get('/schema-failures', getSchemaFailures)

// GET /api/admin/schema-failures/stats - Get aggregated failure statistics
router.get('/schema-failures/stats', getSchemaFailureStats)

// DELETE /api/admin/schema-failures/:id - Delete a schema failure record
router.delete('/schema-failures/:id', deleteSchemaFailure)

// Advanced Analytics Routes

// GET /api/admin/analytics/power-users - Get power users analytics
router.get('/analytics/power-users', getPowerUsersAnalytics)

// GET /api/admin/analytics/schema-quality - Get schema quality metrics
router.get('/analytics/schema-quality', getSchemaQualityAnalytics)

// GET /api/admin/analytics/conversions - Get conversion funnel metrics
router.get('/analytics/conversions', getConversionAnalytics)

export default router
