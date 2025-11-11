import { Response } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { hubspotOAuthService } from '../services/hubspot/oauth.js'
import { hubspotCMSService } from '../services/hubspot/cms.js'
import { db } from '../services/database.js'

/**
 * Handle OAuth callback from Clerk/HubSpot
 * Supports TWO flows:
 * 1. SuperSchema-first: User authenticated → connects HubSpot (original flow)
 * 2. Marketplace-first: User installs from HubSpot Marketplace → creates account later
 */
export const handleOAuthCallback = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId // May be undefined for marketplace-first flow
    const { code, redirectUri, state } = req.body
    const requestTimestamp = new Date().toISOString()

    console.log('🔄 [HubSpot Controller] Processing OAuth callback', {
      userId: userId || 'UNAUTHENTICATED',
      hasCode: !!code,
      hasState: !!state,
      codePreview: code ? code.substring(0, 20) + '...' : null,
      statePreview: state ? state.substring(0, 10) + '...' : null,
      redirectUri: redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`,
      timestamp: requestTimestamp,
      flow: userId ? 'superschema-first' : 'marketplace-first'
    })

    // Track timing for debugging code expiration issues
    const callbackStartTime = Date.now()

    if (!code) {
      console.error('❌ [HubSpot Controller] Missing authorization code', {
        userId: userId || 'UNAUTHENTICATED',
        timestamp: requestTimestamp,
        error: 'NO_CODE'
      })
      throw createError('Authorization code is required', 400)
    }

    // Extract region from authorization code for regional API routing
    const region = code.match(/^(na1|eu1|ap1)-/)?.[1] || 'na1'

    try {
      // FLOW DETECTION: Authenticated vs Unauthenticated
      if (userId) {
        // ========================================
        // FLOW 1: SuperSchema-First (Authenticated)
        // ========================================
        console.log('🎯 [HubSpot Controller] Flow 1: SuperSchema-first (authenticated user)')

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

        // Step 2: Get account information
        console.log('🔄 [HubSpot Controller] Step 2: Fetching account information', { userId, region })
        const accountInfo = await hubspotOAuthService.getAccountInfo(tokens.access_token, region)
        console.log('✅ [HubSpot Controller] Step 2 complete: Account info received', {
          userId,
          region,
          portalId: accountInfo.hub_id,
          portalName: accountInfo.hub_domain,
          scopeCount: accountInfo.scopes?.length || 0
        })

        // Step 3: Store connection immediately
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
            scopes: accountInfo.scopes,
            flow: 'authenticated'
          },
          message: 'HubSpot account connected successfully'
        })

      } else {
        // ========================================
        // FLOW 2: Marketplace-First (Unauthenticated)
        // ========================================
        console.log('🎯 [HubSpot Controller] Flow 2: Marketplace-first (unauthenticated user)')

        // State parameter validation (optional for marketplace installations)
        // When HubSpot initiates the OAuth flow (marketplace installation), there's no state parameter
        // When SuperSchema initiates (user clicks "Connect"), state is present for CSRF protection
        if (state) {
          console.log('🔐 [HubSpot Controller] State parameter present - validating format')
          if (!hubspotOAuthService.isValidStateFormat(state)) {
            console.error('❌ [HubSpot Controller] Invalid state parameter format', { state: state.substring(0, 10) + '...' })
            throw createError('Invalid state parameter format. Please try connecting again.', 400)
          }
          console.log('✅ [HubSpot Controller] State parameter validation passed')
        } else {
          console.log('ℹ️ [HubSpot Controller] No state parameter - likely marketplace-initiated installation')
        }

        // Step 1: Exchange code for tokens IMMEDIATELY (before user completes signup)
        // OAuth codes expire in ~60 seconds, so we must exchange them now
        const exchangeStartTime = Date.now()
        console.log('🔄 [HubSpot Controller] Step 1: Exchanging code for tokens (URGENT - code expires soon)', {
          region,
          elapsedSinceCallback: `${Date.now() - callbackStartTime}ms`
        })
        const tokens = await hubspotOAuthService.exchangeCodeForTokens(
          code,
          redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`
        )
        const exchangeDuration = Date.now() - exchangeStartTime
        console.log('✅ [HubSpot Controller] Step 1 complete: Tokens received', {
          region,
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
          exchangeDuration: `${exchangeDuration}ms`,
          totalElapsed: `${Date.now() - callbackStartTime}ms`
        })

        // Step 2: Get account information
        console.log('🔄 [HubSpot Controller] Step 2: Fetching account information', { region })
        const accountInfo = await hubspotOAuthService.getAccountInfo(tokens.access_token, region)
        console.log('✅ [HubSpot Controller] Step 2 complete: Account info received', {
          region,
          portalId: accountInfo.hub_id,
          portalName: accountInfo.hub_domain,
          scopeCount: accountInfo.scopes?.length || 0
        })

        // Step 3: Store as PENDING connection (to be claimed after signup)
        console.log('🔄 [HubSpot Controller] Step 3: Storing pending connection', { state: state.substring(0, 10) + '...' })

        // Encrypt tokens for storage
        const { encrypt } = await import('../services/encryption.js')
        const encryptedAccessToken = encrypt(tokens.access_token)
        const encryptedRefreshToken = encrypt(tokens.refresh_token)

        // Store both tokens as JSON in oauth_code field (reusing the field)
        const tokenData = JSON.stringify({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresIn: tokens.expires_in,
          region
        })

        await db.createPendingHubSpotConnection({
          stateToken: state,
          oauthCode: tokenData, // Actually storing encrypted tokens
          hubspotPortalId: accountInfo.hub_id.toString(),
          portalName: accountInfo.hub_domain,
          redirectUri: redirectUri || `${process.env.CLIENT_URL}/hubspot/callback`,
          scopes: accountInfo.scopes,
          expiresInMinutes: 30 // Give user 30 minutes to complete signup
        })

        console.log('✅ [HubSpot Controller] Pending connection stored, user has 30 minutes to complete signup', {
          state: state.substring(0, 10) + '...',
          portalId: accountInfo.hub_id,
          duration: `${Date.now() - new Date(requestTimestamp).getTime()}ms`
        })

        res.json({
          success: true,
          data: {
            state,
            portalId: accountInfo.hub_id,
            portalName: accountInfo.hub_domain,
            requiresSignup: true,
            expiresInMinutes: 30,
            flow: 'pending'
          },
          message: 'Please complete signup to finish connecting your HubSpot account'
        })
      }
    } catch (error) {
      // Enhanced error logging with context
      const errorDetails: any = {
        userId: userId || 'UNAUTHENTICATED',
        hasCode: !!code,
        codePreview: code ? code.substring(0, 20) + '...' : null,
        statePreview: state ? state.substring(0, 10) + '...' : null,
        region,
        requestTimestamp,
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${Date.now() - new Date(requestTimestamp).getTime()}ms`
      }

      // Add HubSpot API error details if available (axios errors)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        errorDetails.hubspotApiStatus = axiosError.response?.status
        errorDetails.hubspotApiError = axiosError.response?.data
        errorDetails.hubspotApiUrl = axiosError.config?.url
      }

      console.error('❌ [HubSpot Controller] OAuth callback failed', errorDetails)

      // Determine user-friendly error message and appropriate HTTP status code
      let userMessage = 'Failed to connect HubSpot account'
      let statusCode = 500

      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase()

        // Client errors (4xx) - user can fix these
        if (errMsg.includes('expired')) {
          userMessage = 'Authorization code has expired. HubSpot OAuth codes expire in 60 seconds. Please try the connection process again without delays or page refreshes.'
          statusCode = 400
        } else if (errMsg.includes('invalid authorization code')) {
          userMessage = 'Authorization code is invalid. This can happen if you refreshed the page or used the back button. Please start the connection process again.'
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
        } else if (errMsg.includes('state parameter')) {
          userMessage = error.message
          statusCode = 400
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
 * Claim a pending HubSpot connection (Marketplace-first flow)
 * After user completes signup, this endpoint claims the pending connection
 */
export const claimPendingConnection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.userId
    const { state } = req.body

    console.log('🔄 [HubSpot Controller] Claiming pending connection', {
      userId,
      state: state ? state.substring(0, 10) + '...' : 'MISSING'
    })

    if (!state) {
      throw createError('State parameter is required', 400)
    }

    // Validate state format
    if (!hubspotOAuthService.isValidStateFormat(state)) {
      throw createError('Invalid state parameter format', 400)
    }

    // Get pending connection
    const pendingConnection = await db.getPendingHubSpotConnection(state)

    if (!pendingConnection) {
      console.warn('❌ [HubSpot Controller] Pending connection not found or expired', { state: state.substring(0, 10) + '...' })
      throw createError('Connection not found or expired. Please reconnect from HubSpot.', 404)
    }

    try {
      // Parse stored token data (encrypted tokens stored in oauth_code field)
      const tokenData = JSON.parse(pendingConnection.oauthCode)
      const { decrypt } = await import('../services/encryption.js')

      // Decrypt tokens
      const accessToken = decrypt(tokenData.accessToken)
      const refreshToken = decrypt(tokenData.refreshToken)

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000)

      // Store connection in hubspot_connections table
      console.log('🔄 [HubSpot Controller] Storing claimed connection', {
        userId,
        portalId: pendingConnection.hubspotPortalId,
        region: tokenData.region
      })

      const connectionId = await db.createHubSpotConnection({
        userId,
        hubspotPortalId: pendingConnection.hubspotPortalId!,
        portalName: pendingConnection.portalName || undefined,
        accessToken: tokenData.accessToken, // Already encrypted
        refreshToken: tokenData.refreshToken, // Already encrypted
        tokenExpiresAt: expiresAt,
        scopes: pendingConnection.scopes || [],
        region: tokenData.region
      })

      // Mark pending connection as claimed (atomic operation handled by database function)
      await db.claimPendingHubSpotConnection(state, userId)

      console.log('✅ [HubSpot Controller] Pending connection claimed successfully', {
        userId,
        connectionId,
        portalId: pendingConnection.hubspotPortalId
      })

      res.json({
        success: true,
        data: {
          connectionId,
          portalId: pendingConnection.hubspotPortalId,
          portalName: pendingConnection.portalName,
          scopes: pendingConnection.scopes
        },
        message: 'HubSpot account connected successfully'
      })

    } catch (error) {
      console.error('❌ [HubSpot Controller] Failed to claim pending connection', {
        userId,
        state: state.substring(0, 10) + '...',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // If it's a token/decryption error, provide helpful message
      if (error instanceof Error && (error.message.includes('decrypt') || error.message.includes('JSON'))) {
        throw createError('Connection data is corrupted. Please reconnect from HubSpot.', 500)
      }

      throw error
    }
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
