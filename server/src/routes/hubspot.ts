import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as hubspotController from '../controllers/hubspotController.js'

const router = Router()

// All routes require authentication (callback is called from authenticated client)
router.use(authMiddleware)

// OAuth callback - receives code from client after HubSpot redirect
router.post('/callback', hubspotController.handleOAuthCallback)

// Connection management
router.get('/connections', hubspotController.getConnections)
router.get('/connections/:connectionId/validate', hubspotController.validateConnection)
router.delete('/connections/:connectionId', hubspotController.disconnectAccount)

// Domain association
router.patch('/connections/:connectionId/domains/add', hubspotController.addDomainToConnection)
router.patch('/connections/:connectionId/domains/remove', hubspotController.removeDomainFromConnection)
router.get('/connections/for-domain/:domain', hubspotController.findConnectionByDomain)

// Content discovery
router.get('/content/posts', hubspotController.listBlogPosts)
router.get('/content/pages', hubspotController.listPages)
router.get('/content/match', hubspotController.matchContent)

// Schema sync
router.post('/sync/push', hubspotController.pushSchema)
router.get('/sync/history', hubspotController.getSyncHistory)

export default router
