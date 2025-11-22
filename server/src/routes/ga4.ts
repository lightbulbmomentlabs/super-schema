import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as ga4Controller from '../controllers/ga4Controller.js'

const router = Router()

// All GA4 routes require authentication
router.use(authMiddleware)

// OAuth flow
router.get('/auth-url', ga4Controller.getAuthUrl)
router.post('/callback', ga4Controller.handleOAuthCallback)

// Connection management
router.get('/connection', ga4Controller.getConnectionStatus)
router.delete('/connection/:connectionId', ga4Controller.disconnectGA4)
router.post('/connection/:connectionId/activate', ga4Controller.setActiveConnection)

// GA4 properties
router.get('/properties', ga4Controller.listProperties)

// Domain mappings
router.post('/domain-mapping', ga4Controller.createDomainMapping)
router.get('/domain-mappings', ga4Controller.listDomainMappings)
router.delete('/domain-mapping/:mappingId', ga4Controller.deleteDomainMapping)

// Path exclusion patterns
router.get('/domain-mapping/:mappingId/exclusions', ga4Controller.listExclusionPatterns)
router.post('/domain-mapping/:mappingId/exclusions', ga4Controller.createExclusionPattern)
router.patch('/domain-mapping/:mappingId/exclusions/:patternId', ga4Controller.updateExclusionPattern)
router.delete('/domain-mapping/:mappingId/exclusions/:patternId', ga4Controller.deleteExclusionPattern)
router.patch('/domain-mapping/:mappingId/exclusions/:patternId/toggle', ga4Controller.toggleExclusionPattern)

// AI Crawler metrics
router.get('/metrics', ga4Controller.getMetrics)
router.post('/metrics/refresh', ga4Controller.refreshMetrics)
router.get('/metrics/trend', ga4Controller.getTrend)

// Daily activity snapshots
router.get('/metrics/activity-snapshots', ga4Controller.getActivitySnapshots)
router.post('/metrics/activity-snapshots', ga4Controller.recordActivitySnapshots)

export default router
