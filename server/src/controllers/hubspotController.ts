import { Response } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { hubspotOAuthService } from '../services/hubspot/oauth.js'
import { hubspotCMSService } from '../services/hubspot/cms.js'
import { db } from '../services/database.js'

/**
 * Handle OAuth callback from Clerk/HubSpot
 * Exchange code for tokens and store connection
 */
export const handleOAuthCallback = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { code, redirectUri } = req.body

    if (!code) {
      throw createError('Authorization code is required', 400)
    }

    console.log('🔄 [HubSpot Controller] Processing OAuth callback for user:', userId)

    try {
      // Exchange code for tokens
      const tokens = await hubspotOAuthService.exchangeCodeForTokens(
        code,
        redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`
      )

      // Get account information
      const accountInfo = await hubspotOAuthService.getAccountInfo(tokens.access_token)

      // Store connection
      const connectionId = await hubspotOAuthService.storeConnection(
        userId,
        tokens,
        accountInfo
      )

      console.log('✅ [HubSpot Controller] OAuth connection created:', connectionId)

      res.json({
        success: true,
        data: {
          connectionId,
          portalId: accountInfo.hub_id,
          portalName: accountInfo.hub_domain,
          scopes: accountInfo.scopes
        },
        message: 'HubSpot account connected successfully'
      })
    } catch (error) {
      console.error('❌ [HubSpot Controller] OAuth callback failed:', error)
      throw createError(
        error instanceof Error ? error.message : 'Failed to connect HubSpot account',
        500
      )
    }
  }
)

/**
 * Get user's HubSpot connections
 */
export const getConnections = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId

    const connections = await db.getUserHubSpotConnections(userId)

    res.json({
      success: true,
      data: connections
    })
  }
)

/**
 * Validate a HubSpot connection
 */
export const validateConnection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.params

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    const isValid = await hubspotOAuthService.validateConnection(connectionId)

    res.json({
      success: true,
      data: {
        isValid,
        connectionId
      }
    })
  }
)

/**
 * Disconnect HubSpot account
 */
export const disconnectAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.params

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    await hubspotOAuthService.revokeConnection(connectionId)

    res.json({
      success: true,
      message: 'HubSpot account disconnected successfully'
    })
  }
)

/**
 * List blog posts for connected portal
 */
export const listBlogPosts = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.query

    if (!connectionId || typeof connectionId !== 'string') {
      throw createError('Connection ID is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    const posts = await hubspotCMSService.listBlogPosts(connectionId)

    res.json({
      success: true,
      data: posts
    })
  }
)

/**
 * List pages for connected portal
 */
export const listPages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.query

    if (!connectionId || typeof connectionId !== 'string') {
      throw createError('Connection ID is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    const pages = await hubspotCMSService.listPages(connectionId)

    res.json({
      success: true,
      data: pages
    })
  }
)

/**
 * Match URL to HubSpot content
 */
export const matchContent = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId, url } = req.query

    if (!connectionId || typeof connectionId !== 'string') {
      throw createError('Connection ID is required', 400)
    }

    if (!url || typeof url !== 'string') {
      throw createError('URL is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    const matches = await hubspotCMSService.matchUrlToContent(connectionId, url)

    res.json({
      success: true,
      data: matches
    })
  }
)

/**
 * Push schema to HubSpot content
 */
export const pushSchema = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const {
      connectionId,
      contentId,
      contentType,
      schemaHtml,
      schemaGenerationId,
      contentTitle,
      contentUrl
    } = req.body

    if (!connectionId || !contentId || !contentType || !schemaHtml) {
      throw createError('Missing required fields', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    // Create sync job
    const syncJobId = await db.createHubSpotSyncJob({
      userId,
      connectionId,
      schemaGenerationId,
      hubspotContentId: contentId,
      hubspotContentType: contentType,
      hubspotContentTitle: contentTitle,
      hubspotContentUrl: contentUrl
    })

    try {
      // Push schema to HubSpot
      if (contentType === 'blog_post') {
        await hubspotCMSService.pushSchemaToPost(connectionId, contentId, schemaHtml)
      } else if (contentType === 'page' || contentType === 'landing_page') {
        await hubspotCMSService.pushSchemaToPage(connectionId, contentId, schemaHtml)
      } else {
        throw createError('Invalid content type', 400)
      }

      // Update sync job as successful
      await db.updateHubSpotSyncJobSuccess(syncJobId)

      console.log('✅ [HubSpot Controller] Schema pushed successfully:', {
        syncJobId,
        contentId,
        contentType
      })

      res.json({
        success: true,
        data: {
          syncJobId,
          contentId,
          contentType
        },
        message: 'Schema pushed to HubSpot successfully'
      })
    } catch (error) {
      // Update sync job as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await db.updateHubSpotSyncJobFailure(syncJobId, errorMessage)

      console.error('❌ [HubSpot Controller] Schema push failed:', error)
      throw error
    }
  }
)

/**
 * Get sync history for user
 */
export const getSyncHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const history = await db.getHubSpotSyncHistory(userId, limit, offset)

    res.json({
      success: true,
      data: history
    })
  }
)

/**
 * Add domain to HubSpot connection
 */
export const addDomainToConnection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.params
    const { domain } = req.body

    if (!domain) {
      throw createError('Domain is required', 400)
    }

    // Normalize domain - strip protocol, path, trailing slash
    let normalizedDomain = domain.trim()
    try {
      // Try to parse as URL first
      const url = new URL(normalizedDomain.includes('://') ? normalizedDomain : `https://${normalizedDomain}`)
      normalizedDomain = url.hostname
    } catch {
      // If URL parsing fails, treat as plain domain and clean it
      normalizedDomain = normalizedDomain
        .replace(/^https?:\/\//, '')  // Remove protocol
        .replace(/\/.*$/, '')          // Remove path
        .toLowerCase()                 // Lowercase
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    const success = await db.addDomainToConnection(connectionId, normalizedDomain)

    if (!success) {
      throw createError('Domain already associated with this connection', 400)
    }

    res.json({
      success: true,
      message: 'Domain added to connection successfully'
    })
  }
)

/**
 * Remove domain from HubSpot connection
 */
export const removeDomainFromConnection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { connectionId } = req.params
    const { domain } = req.body

    if (!domain) {
      throw createError('Domain is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getHubSpotConnection(connectionId)
    if (!connection || connection.userId !== userId) {
      throw createError('Connection not found', 404)
    }

    await db.removeDomainFromConnection(connectionId, domain)

    res.json({
      success: true,
      message: 'Domain removed from connection successfully'
    })
  }
)

/**
 * Find HubSpot connection by domain
 */
export const findConnectionByDomain = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { domain } = req.params

    if (!domain) {
      throw createError('Domain is required', 400)
    }

    const connection = await db.findConnectionByDomain(userId, domain)

    res.json({
      success: true,
      data: connection
    })
  }
)
