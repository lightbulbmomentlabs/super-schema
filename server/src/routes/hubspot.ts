import { Router } from 'express'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'
import * as hubspotController from '../controllers/hubspotController.js'

const router = Router()

// Health check endpoint (public - no auth required)
router.get('/health', hubspotController.healthCheck)

// OAuth callback - supports BOTH authenticated and unauthenticated requests
// - Authenticated: SuperSchema-first flow (user creates account, then connects)
// - Unauthenticated: Marketplace-first flow (user installs from HubSpot, then creates account)
router.post('/callback', optionalAuth, hubspotController.handleOAuthCallback)

// All routes below require authentication
router.use(authMiddleware)

// Claim pending connection (marketplace-first flow)
router.post('/claim', hubspotController.claimPendingConnection)

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
