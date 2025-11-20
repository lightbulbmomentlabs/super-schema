import { Response } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { ga4OAuth } from '../services/ga4/oauth.js'
import { ga4Data } from '../services/ga4/data.js'
import { db } from '../services/database.js'

/**
 * Generate Google Analytics 4 OAuth authorization URL
 */
export const getAuthUrl = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId

    console.log('🔐 [GA4 Controller] Generating authorization URL', { userId })

    // Generate auth URL
    const authUrl = ga4OAuth.generateAuthUrl(userId)

    console.log('✅ [GA4 Controller] Authorization URL generated', {
      userId,
      urlLength: authUrl.length
    })

    res.json({
      success: true,
      data: {
        authUrl
      }
    })
  }
)

/**
 * Handle OAuth callback from Google
 */
export const handleOAuthCallback = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { code, state } = req.body
    const requestTimestamp = new Date().toISOString()

    console.log('🔄 [GA4 Controller] Processing OAuth callback', {
      userId,
      hasCode: !!code,
      hasState: !!state,
      codePreview: code ? code.substring(0, 20) + '...' : null,
      statePreview: state ? state.substring(0, 10) + '...' : null,
      timestamp: requestTimestamp
    })

    if (!code) {
      console.error('❌ [GA4 Controller] Missing authorization code', {
        userId,
        timestamp: requestTimestamp
      })
      throw createError('Authorization code is required', 400)
    }

    if (!state) {
      console.error('❌ [GA4 Controller] Missing state parameter', {
        userId,
        timestamp: requestTimestamp
      })
      throw createError('State parameter is required', 400)
    }

    try {
      // Step 1: Validate state parameter
      console.log('🔄 [GA4 Controller] Step 1: Validating state parameter', { userId })
      const stateData = ga4OAuth.decodeStateParameter(state)

      if (stateData.userId !== userId) {
        console.error('❌ [GA4 Controller] State parameter user mismatch', {
          userId,
          stateUserId: stateData.userId
        })
        throw createError('Invalid state parameter', 400)
      }

      console.log('✅ [GA4 Controller] Step 1 complete: State validated', { userId })

      // Step 2: Exchange code for tokens
      console.log('🔄 [GA4 Controller] Step 2: Exchanging code for tokens', { userId })
      const tokens = await ga4OAuth.exchangeCodeForTokens(code)

      console.log('✅ [GA4 Controller] Step 2 complete: Tokens received', {
        userId,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Not set'
      })

      // Step 2.5: Fetch Google account email for identification
      console.log('🔄 [GA4 Controller] Step 2.5: Fetching Google account email', { userId })
      const googleAccountEmail = await ga4OAuth.fetchGoogleAccountEmail(tokens.access_token)

      console.log('✅ [GA4 Controller] Step 2.5 complete: Email fetched', {
        userId,
        googleAccountEmail: googleAccountEmail || 'Not available'
      })

      // Step 3: Store connection
      console.log('🔄 [GA4 Controller] Step 3: Storing connection in database', { userId })
      const scopes = tokens.scope ? tokens.scope.split(' ') : []
      const connectionId = await ga4OAuth.storeConnection(
        userId,
        null, // teamId - not implemented yet
        tokens,
        scopes,
        googleAccountEmail || undefined
      )

      console.log('✅ [GA4 Controller] Step 3 complete: Connection stored', {
        userId,
        connectionId
      })

      console.log('✅ [GA4 Controller] OAuth flow completed successfully', {
        userId,
        connectionId,
        durationMs: Date.now() - new Date(requestTimestamp).getTime()
      })

      res.json({
        success: true,
        connectionId,
        message: 'Google Analytics connected successfully'
      })
    } catch (error) {
      console.error('❌ [GA4 Controller] OAuth callback failed:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: requestTimestamp
      })
      throw error
    }
  }
)

/**
 * Get current GA4 connection status
 * Returns all connections and the currently active one
 */
export const getConnectionStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId

    console.log('🔍 [GA4 Controller] Getting connection status', { userId })

    // Get all connections for the user
    const allConnections = await db.listGA4Connections(userId)

    // Get the active connection
    const activeConnection = allConnections.find(c => c.isActive)

    if (allConnections.length === 0) {
      console.log('ℹ️ [GA4 Controller] No connections found', { userId })
      return res.json({
        success: true,
        connected: false,
        connections: [],
        activeConnection: null
      })
    }

    console.log('✅ [GA4 Controller] Connections found', {
      userId,
      totalConnections: allConnections.length,
      activeConnectionId: activeConnection?.id
    })

    // Map connections to safe response format (exclude sensitive tokens)
    const safeConnections = allConnections.map(conn => ({
      id: conn.id,
      googleAccountEmail: conn.googleAccountEmail,
      scopes: conn.scopes,
      isActive: conn.isActive,
      connectedAt: conn.connectedAt,
      lastValidatedAt: conn.lastValidatedAt
    }))

    res.json({
      success: true,
      connected: true,
      connections: safeConnections,
      activeConnection: activeConnection ? {
        id: activeConnection.id,
        googleAccountEmail: activeConnection.googleAccountEmail,
        scopes: activeConnection.scopes,
        connectedAt: activeConnection.connectedAt,
        lastValidatedAt: activeConnection.lastValidatedAt
      } : null
    })
  }
)

/**
 * Disconnect GA4 connection by ID
 */
export const disconnectGA4 = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { connectionId } = req.params

    console.log('🗑️ [GA4 Controller] Disconnecting GA4 connection', { userId, connectionId })

    if (!connectionId) {
      throw createError('Connection ID is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getGA4ConnectionById(connectionId)
    if (!connection) {
      throw createError('Connection not found', 404)
    }

    if (connection.userId !== userId) {
      throw createError('Unauthorized', 403)
    }

    // Delete the connection (cascade will handle domain mappings)
    await db.deleteGA4Connection(connectionId)

    // If this was the active connection, activate another one if available
    const remainingConnections = await db.listGA4Connections(userId)
    if (remainingConnections.length > 0 && !remainingConnections.some(c => c.isActive)) {
      // No active connection remaining, activate the most recent one
      await db.setActiveGA4Connection(userId, remainingConnections[0].id)
      console.log('ℹ️ [GA4 Controller] Activated most recent connection as default', {
        userId,
        newActiveConnectionId: remainingConnections[0].id
      })
    }

    console.log('✅ [GA4 Controller] GA4 connection disconnected successfully', { userId, connectionId })

    res.json({
      success: true,
      message: 'Google Analytics connection disconnected successfully'
    })
  }
)

/**
 * Set active GA4 connection
 */
export const setActiveConnection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { connectionId } = req.params

    console.log('🔄 [GA4 Controller] Setting active connection', { userId, connectionId })

    if (!connectionId) {
      throw createError('Connection ID is required', 400)
    }

    // Verify connection belongs to user
    const connection = await db.getGA4ConnectionById(connectionId)
    if (!connection) {
      throw createError('Connection not found', 404)
    }

    if (connection.userId !== userId) {
      throw createError('Unauthorized', 403)
    }

    // Switch active connection
    await db.setActiveGA4Connection(userId, connectionId)

    console.log('✅ [GA4 Controller] Active connection switched', { userId, connectionId })

    res.json({
      success: true,
      message: 'Active connection switched successfully',
      connectionId
    })
  }
)

/**
 * List all GA4 properties accessible to the user
 */
export const listProperties = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId

    console.log('📋 [GA4 Controller] Listing GA4 properties', { userId })

    const properties = await ga4Data.listProperties(userId)

    console.log('✅ [GA4 Controller] Properties listed', {
      userId,
      count: properties.length
    })

    res.json({
      success: true,
      properties
    })
  }
)

/**
 * Create a domain mapping to a GA4 property
 */
export const createDomainMapping = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { propertyId, propertyName, domain } = req.body

    console.log('🔗 [GA4 Controller] Creating domain mapping', {
      userId,
      propertyId,
      domain
    })

    if (!propertyId || !propertyName || !domain) {
      throw createError('Property ID, property name, and domain are required', 400)
    }

    // Get connection ID
    const connection = await db.getGA4Connection(userId)
    if (!connection) {
      throw createError('No Google Analytics connection found', 404)
    }

    // Create mapping
    const mappingId = await db.createGA4DomainMapping({
      userId,
      teamId: null, // Not implemented yet
      connectionId: connection.id,
      propertyId,
      propertyName,
      domain
    })

    console.log('✅ [GA4 Controller] Domain mapping created', {
      userId,
      mappingId,
      propertyId,
      domain
    })

    res.json({
      success: true,
      mappingId,
      message: 'Domain mapping created successfully'
    })
  }
)

/**
 * List all domain mappings for the user
 */
export const listDomainMappings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId

    console.log('📋 [GA4 Controller] Listing domain mappings', { userId })

    const mappings = await db.getGA4DomainMappings(userId)

    console.log('✅ [GA4 Controller] Domain mappings listed', {
      userId,
      count: mappings.length
    })

    res.json({
      success: true,
      mappings
    })
  }
)

/**
 * Delete a domain mapping
 */
export const deleteDomainMapping = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { mappingId } = req.params

    console.log('🗑️ [GA4 Controller] Deleting domain mapping', {
      userId,
      mappingId
    })

    if (!mappingId) {
      throw createError('Mapping ID is required', 400)
    }

    await db.deleteGA4DomainMapping(mappingId)

    console.log('✅ [GA4 Controller] Domain mapping deleted', {
      userId,
      mappingId
    })

    res.json({
      success: true,
      message: 'Domain mapping deleted successfully'
    })
  }
)

/**
 * Get AI crawler metrics for a domain
 */
export const getMetrics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { propertyId, startDate, endDate } = req.query

    console.log('📊 [GA4 Controller] Getting AI crawler metrics', {
      userId,
      propertyId,
      startDate,
      endDate
    })

    if (!propertyId || !startDate || !endDate) {
      throw createError('Property ID, start date, and end date are required', 400)
    }

    // Parse dates
    const dateRangeStart = new Date(startDate as string)
    const dateRangeEnd = new Date(endDate as string)

    if (isNaN(dateRangeStart.getTime()) || isNaN(dateRangeEnd.getTime())) {
      throw createError('Invalid date format', 400)
    }

    // Get metrics
    const metrics = await ga4Data.getAICrawlerMetrics(
      userId,
      propertyId as string,
      dateRangeStart,
      dateRangeEnd,
      false // Don't force refresh by default
    )

    console.log('✅ [GA4 Controller] Metrics retrieved', {
      userId,
      propertyId,
      aiVisibilityScore: metrics.aiVisibilityScore
    })

    res.json({
      success: true,
      metrics
    })
  }
)

/**
 * Refresh AI crawler metrics for a domain (force API call)
 */
export const refreshMetrics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { propertyId, startDate, endDate } = req.body

    console.log('🔄 [GA4 Controller] Refreshing AI crawler metrics', {
      userId,
      propertyId,
      startDate,
      endDate
    })

    if (!propertyId || !startDate || !endDate) {
      throw createError('Property ID, start date, and end date are required', 400)
    }

    // Parse dates
    const dateRangeStart = new Date(startDate)
    const dateRangeEnd = new Date(endDate)

    if (isNaN(dateRangeStart.getTime()) || isNaN(dateRangeEnd.getTime())) {
      throw createError('Invalid date format', 400)
    }

    // Force refresh metrics
    const metrics = await ga4Data.getAICrawlerMetrics(
      userId,
      propertyId,
      dateRangeStart,
      dateRangeEnd,
      true // Force refresh
    )

    console.log('✅ [GA4 Controller] Metrics refreshed', {
      userId,
      propertyId,
      aiVisibilityScore: metrics.aiVisibilityScore
    })

    res.json({
      success: true,
      metrics,
      message: 'Metrics refreshed successfully'
    })
  }
)

/**
 * Get AI Visibility Score trend over time
 */
export const getTrend = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId
    const { propertyId, startDate, endDate } = req.query

    console.log('📈 [GA4 Controller] Getting AI Visibility trend', {
      userId,
      propertyId,
      startDate,
      endDate
    })

    if (!propertyId || !startDate || !endDate) {
      throw createError('Property ID, start date, and end date are required', 400)
    }

    // Parse dates
    const dateRangeStart = new Date(startDate as string)
    const dateRangeEnd = new Date(endDate as string)

    if (isNaN(dateRangeStart.getTime()) || isNaN(dateRangeEnd.getTime())) {
      throw createError('Invalid date format', 400)
    }

    // Get trend data
    const trendData = await ga4Data.getAIVisibilityTrend(
      userId,
      propertyId as string,
      dateRangeStart,
      dateRangeEnd
    )

    console.log('✅ [GA4 Controller] Trend data retrieved', {
      userId,
      propertyId,
      dataPoints: trendData.length
    })

    res.json({
      success: true,
      trend: trendData
    })
  }
)
