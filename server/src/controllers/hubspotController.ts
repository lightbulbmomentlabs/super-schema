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
    const requestTimestamp = new Date().toISOString()

    console.log('🔄 [HubSpot Controller] Processing OAuth callback', {
      userId,
      hasCode: !!code,
      codePreview: code ? code.substring(0, 20) + '...' : null,
      redirectUri: redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`,
      timestamp: requestTimestamp
    })

    if (!code) {
      console.error('❌ [HubSpot Controller] Missing authorization code', {
        userId,
        timestamp: requestTimestamp,
        error: 'NO_CODE'
      })
      throw createError('Authorization code is required', 400)
    }

    // Extract region from authorization code for regional API routing
    const region = code.match(/^(na1|eu1|ap1)-/)?.[1] || 'na1'

    try {
      // Step 1: Exchange code for tokens
      console.log('🔄 [HubSpot Controller] Step 1: Exchanging code for tokens', { userId, region })
      const tokens = await hubspotOAuthService.exchangeCodeForTokens(
        code,
        redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`
      )
      console.log('✅ [HubSpot Controller] Step 1 complete: Tokens received', {
        userId,
        region,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      })

      // Step 2: Get account information (pass region for correct endpoint)
      console.log('🔄 [HubSpot Controller] Step 2: Fetching account information', { userId, region })
      const accountInfo = await hubspotOAuthService.getAccountInfo(tokens.access_token, region)
      console.log('✅ [HubSpot Controller] Step 2 complete: Account info received', {
        userId,
        region,
        portalId: accountInfo.hub_id,
        portalName: accountInfo.hub_domain,
        scopeCount: accountInfo.scopes?.length || 0
      })

      // Step 3: Store connection
      console.log('🔄 [HubSpot Controller] Step 3: Storing connection in database', { userId, region })
      const connectionId = await hubspotOAuthService.storeConnection(
        userId,
        tokens,
        accountInfo,
        region
      )
      console.log('✅ [HubSpot Controller] Step 3 complete: Connection stored', {
        userId,
        region,
        connectionId,
        portalId: accountInfo.hub_id
      })

      console.log('✅ [HubSpot Controller] OAuth flow completed successfully', {
        userId,
        connectionId,
        portalId: accountInfo.hub_id,
        duration: `${Date.now() - new Date(requestTimestamp).getTime()}ms`
      })

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
      // Enhanced error logging with context
      const errorDetails = {
        userId,
        region,
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${Date.now() - new Date(requestTimestamp).getTime()}ms`
      }

      console.error('❌ [HubSpot Controller] OAuth callback failed', errorDetails)

      // Determine user-friendly error message and appropriate HTTP status code
      let userMessage = 'Failed to connect HubSpot account'
      let statusCode = 500

      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase()

        // Client errors (4xx) - user can fix these
        if (errMsg.includes('invalid authorization code') || errMsg.includes('expired')) {
          userMessage = 'Authorization code is invalid or expired. Please try connecting again.'
          statusCode = 400
        } else if (errMsg.includes('invalid client credentials')) {
          userMessage = 'HubSpot app configuration error. Please contact support.'
          statusCode = 500 // Server config issue
        } else if (errMsg.includes('invalid or expired access token')) {
          userMessage = 'Authorization failed. Please try connecting again.'
          statusCode = 401
        } else if (errMsg.includes('insufficient permissions')) {
          userMessage = 'Please grant all required permissions when connecting HubSpot.'
          statusCode = 403
        } else if (errMsg.includes('endpoint not found')) {
          userMessage = `HubSpot region (${region}) configuration error. Please contact support.`
          statusCode = 500
        } else if (errMsg.includes('encryption')) {
          userMessage = 'Server configuration error. Please contact support.'
          statusCode = 500
        } else if (errMsg.includes('database')) {
          userMessage = 'Database error while saving connection. Please try again or contact support.'
          statusCode = 500
        } else if (errMsg.includes('already connected')) {
          userMessage = error.message // Use the specific message from the error
          statusCode = 409 // Conflict
        } else {
          // Use the actual error message if it's descriptive
          userMessage = error.message
          // Keep 500 for unknown errors
        }
      }

      throw createError(userMessage, statusCode)
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

/**
 * Health check endpoint for HubSpot integration
 * Verifies that HubSpot credentials are properly configured
 */
export const healthCheck = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const hasClientId = !!process.env.HUBSPOT_CLIENT_ID
    const hasClientSecret = !!process.env.HUBSPOT_CLIENT_SECRET
    const hasEncryptionKey = !!process.env.HUBSPOT_ENCRYPTION_KEY

    const isConfigured = hasClientId && hasClientSecret && hasEncryptionKey

    console.log('🏥 [HubSpot Health] Health check requested', {
      hasClientId,
      hasClientSecret,
      hasEncryptionKey,
      isConfigured,
      timestamp: new Date().toISOString()
    })

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        checks: {
          clientId: hasClientId,
          clientSecret: hasClientSecret,
          encryptionKey: hasEncryptionKey
        },
        message: isConfigured
          ? 'HubSpot integration is properly configured'
          : 'HubSpot integration is missing required environment variables'
      }
    })
  }
)
