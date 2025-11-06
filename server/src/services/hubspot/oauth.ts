/**
 * HubSpot OAuth Service
 * Manages OAuth token lifecycle for HubSpot integration
 *
 * IMPORTANT: HubSpot uses a unified API endpoint (api.hubapi.com) for ALL regions
 * - The endpoint automatically routes to the correct region based on tokens
 * - Authorization codes are prefixed with the region (e.g., na1-, eu1-, ap1-)
 * - HubSpot's infrastructure handles regional routing via Cloudflare Workers
 * - Region-specific endpoints like api.eu1.hubapi.com do NOT exist in DNS
 */

import axios from 'axios'
import crypto from 'crypto'
import { encrypt, decrypt } from '../encryption.js'
import { db } from '../database.js'

// HubSpot API endpoints are region-specific
function getRegionFromCode(code: string): string {
  // Extract region prefix from authorization code
  const regionMatch = code.match(/^(na1|eu1|ap1)-/)
  return regionMatch ? regionMatch[1] : 'na1' // Default to NA1 for backwards compatibility
}

/**
 * Get HubSpot API base URL
 *
 * IMPORTANT: Always returns api.hubapi.com for ALL regions (na1, eu1, ap1)
 * HubSpot's infrastructure automatically routes API calls to the correct region
 * based on the access token or authorization code used in the request.
 *
 * Region-specific endpoints (api.eu1.hubapi.com, api.ap1.hubapi.com) do NOT exist.
 */
export function getHubSpotApiBaseUrl(region: string): string {
  // Always use unified endpoint - HubSpot handles regional routing automatically
  return 'https://api.hubapi.com'
}

interface HubSpotTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: string
}

interface HubSpotAccountInfo {
  hub_id: number
  hub_domain: string
  scopes: string[]
  app_id: number
  user_id: number
}

export class HubSpotOAuthService {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = process.env.HUBSPOT_CLIENT_ID || ''
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET || ''

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ [HubSpot OAuth] Client ID or Secret not configured')
    }
  }

  /**
   * Generate a secure state parameter for CSRF protection
   * Should be stored client-side and validated on callback
   */
  generateStateParameter(): string {
    // Generate 32 bytes (256 bits) of random data
    const randomBytes = crypto.randomBytes(32)
    // Convert to base64url (URL-safe base64)
    const stateToken = randomBytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    console.log('🔐 [HubSpot OAuth] Generated state parameter:', stateToken.substring(0, 10) + '...')
    return stateToken
  }

  /**
   * Validate state parameter (basic format check)
   * Actual validation happens by checking if it exists in pending_hubspot_connections
   */
  isValidStateFormat(state: string): boolean {
    // Should be 43 characters (32 bytes base64url encoded without padding)
    // But allow some flexibility for different encoding
    if (!state || state.length < 32 || state.length > 64) {
      return false
    }

    // Should only contain base64url characters
    const base64urlPattern = /^[A-Za-z0-9_-]+$/
    return base64urlPattern.test(state)
  }

  /**
   * Exchange authorization code for access token
   * Uses unified api.hubapi.com endpoint with automatic region routing
   * HubSpot's Cloudflare Worker routes based on the authorization code prefix
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<HubSpotTokenResponse> {
    const region = getRegionFromCode(code)
    // IMPORTANT: Always use api.hubapi.com - HubSpot handles regional routing automatically
    // Region-specific endpoints like api.eu1.hubapi.com do NOT exist in DNS
    const tokenUrl = 'https://api.hubapi.com/oauth/v1/token'
    const startTime = Date.now()

    try {
      console.log('🔄 [HubSpot OAuth] Exchanging code for tokens (unified endpoint with auto-routing)', {
        region,
        codePrefix: code.substring(0, 4) + '...',
        endpoint: tokenUrl,
        redirectUri,
        startTime: new Date(startTime).toISOString()
      })

      const response = await axios.post<HubSpotTokenResponse>(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          code
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000 // 15 second timeout
        }
      )

      const duration = Date.now() - startTime
      console.log('✅ [HubSpot OAuth] Successfully exchanged code for tokens', {
        region,
        durationMs: duration,
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token,
        expiresIn: response.data.expires_in
      })
      return response.data
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ [HubSpot OAuth] Failed to exchange code:', {
        region,
        endpoint: tokenUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined,
        responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
        durationMs: duration,
        codePrefix: code.substring(0, 4) + '...'
      })

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status
        const errorMessage = error.response?.data?.message || error.message

        if (statusCode === 400) {
          throw new Error(`Invalid authorization code or redirect URI: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Invalid client credentials. Please check HubSpot Client ID and Secret.')
        } else if (statusCode === 404) {
          throw new Error(`HubSpot API endpoint not found. Region: ${region}`)
        } else {
          throw new Error(`HubSpot token exchange failed (${statusCode}): ${errorMessage}`)
        }
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   * Uses unified api.hubapi.com endpoint with automatic region routing
   * HubSpot's refresh tokens contain region info for automatic routing
   */
  async refreshAccessToken(refreshToken: string, region: string = 'na1'): Promise<HubSpotTokenResponse> {
    // IMPORTANT: Always use api.hubapi.com - HubSpot handles regional routing automatically
    // The refresh token itself contains region information for routing
    const tokenUrl = 'https://api.hubapi.com/oauth/v1/token'

    try {
      console.log('🔄 [HubSpot OAuth] Refreshing access token (unified endpoint with auto-routing)', { region })

      const response = await axios.post<HubSpotTokenResponse>(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        }
      )

      console.log('✅ [HubSpot OAuth] Successfully refreshed access token', { region })
      return response.data
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to refresh token:', {
        region,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined
      })

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to refresh access token'
        )
      }
      throw error
    }
  }

  /**
   * Get account information using access token
   * Uses unified api.hubapi.com endpoint with automatic region routing
   * HubSpot's access tokens contain region info for automatic routing
   */
  async getAccountInfo(accessToken: string, region: string = 'na1'): Promise<HubSpotAccountInfo> {
    // IMPORTANT: Always use api.hubapi.com - HubSpot handles regional routing automatically
    // The access token itself contains region information for routing
    const accountInfoUrl = `https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`

    try {
      console.log('🔄 [HubSpot OAuth] Getting account information (unified endpoint with auto-routing)', {
        region,
        endpoint: accountInfoUrl,
        tokenPrefix: accessToken.substring(0, 10) + '...'
      })

      const response = await axios.get<HubSpotAccountInfo>(
        accountInfoUrl,
        {
          timeout: 15000 // 15 second timeout
        }
      )

      console.log('✅ [HubSpot OAuth] Successfully retrieved account info', {
        region,
        hubId: response.data.hub_id,
        hubDomain: response.data.hub_domain
      })

      return response.data
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to get account info:', {
        region,
        endpoint: accountInfoUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined,
        responseData: axios.isAxiosError(error) ? error.response?.data : undefined
      })

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status
        const errorMessage = error.response?.data?.message || error.message

        if (statusCode === 401) {
          throw new Error('Invalid or expired access token')
        } else if (statusCode === 403) {
          throw new Error('Insufficient permissions. Please reconnect your HubSpot account.')
        } else if (statusCode === 404) {
          throw new Error(`HubSpot API endpoint not found. Region: ${region}`)
        } else {
          throw new Error(`Failed to retrieve account information (${statusCode}): ${errorMessage}`)
        }
      }
      throw error
    }
  }

  /**
   * Store new connection in database
   * Handles encryption and database storage with detailed error reporting
   */
  async storeConnection(
    userId: string,
    tokens: HubSpotTokenResponse,
    accountInfo: HubSpotAccountInfo,
    region: string = 'na1'
  ): Promise<string> {
    try {
      console.log('🔄 [HubSpot OAuth] Storing connection', {
        userId,
        hubId: accountInfo.hub_id,
        portalName: accountInfo.hub_domain,
        scopeCount: accountInfo.scopes.length
      })

      // Encrypt tokens before storage
      let encryptedAccessToken: string
      let encryptedRefreshToken: string

      try {
        encryptedAccessToken = encrypt(tokens.access_token)
        encryptedRefreshToken = encrypt(tokens.refresh_token)
      } catch (encryptError) {
        console.error('❌ [HubSpot OAuth] Encryption failed:', {
          error: encryptError instanceof Error ? encryptError.message : 'Unknown encryption error',
          userId,
          hubId: accountInfo.hub_id
        })
        throw new Error('Failed to encrypt HubSpot tokens. Please check HUBSPOT_ENCRYPTION_KEY configuration.')
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      // Store in database
      try {
        const connectionId = await db.createHubSpotConnection({
          userId,
          hubspotPortalId: accountInfo.hub_id.toString(),
          portalName: accountInfo.hub_domain,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: expiresAt,
          scopes: accountInfo.scopes,
          region
        })

        console.log('✅ [HubSpot OAuth] Successfully stored connection', {
          connectionId,
          userId,
          hubId: accountInfo.hub_id,
          expiresAt: expiresAt.toISOString()
        })

        return connectionId
      } catch (dbError: any) {
        console.error('❌ [HubSpot OAuth] Database storage failed:', {
          error: dbError.message || 'Unknown database error',
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
          userId,
          hubId: accountInfo.hub_id
        })

        // Provide specific error messages for common database issues
        if (dbError.code === '23505') {
          throw new Error('This HubSpot account is already connected. Try disconnecting and reconnecting.')
        } else if (dbError.code === '23502') {
          throw new Error('Missing required database fields. Please contact support.')
        } else if (dbError.code === '23514') {
          throw new Error('Database validation failed. Please check token format.')
        } else {
          throw new Error(`Database error (${dbError.code}): ${dbError.message}`)
        }
      }
    } catch (error) {
      // Re-throw if already a formatted error
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }

      // Otherwise, log and throw generic error
      console.error('❌ [HubSpot OAuth] Unexpected error storing connection:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        hubId: accountInfo.hub_id
      })
      throw new Error('Failed to store HubSpot connection')
    }
  }

  /**
   * Ensure token is fresh, refresh if needed
   * Returns decrypted access token
   */
  async ensureFreshToken(connectionId: string): Promise<string> {
    try {
      const connection = await db.getHubSpotConnection(connectionId)

      if (!connection) {
        throw new Error('HubSpot connection not found')
      }

      if (!connection.isActive) {
        throw new Error('HubSpot connection is inactive')
      }

      // Check if token expires soon (within 5 minutes)
      const expiresAt = new Date(connection.tokenExpiresAt)
      const now = new Date()
      const bufferMs = 5 * 60 * 1000 // 5 minutes

      if (expiresAt.getTime() - now.getTime() < bufferMs) {
        console.log('🔄 [HubSpot OAuth] Token expiring soon, refreshing...')

        // Decrypt refresh token
        const refreshToken = decrypt(connection.refreshToken)

        // Get new tokens using the connection's region
        const region = connection.region || 'na1'
        const newTokens = await this.refreshAccessToken(refreshToken, region)

        // Encrypt new tokens
        const encryptedAccessToken = encrypt(newTokens.access_token)
        const encryptedRefreshToken = encrypt(newTokens.refresh_token)

        // Calculate new expiration
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000)

        // Update in database
        await db.updateHubSpotTokens(connectionId, {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: newExpiresAt
        })

        console.log('✅ [HubSpot OAuth] Token refreshed successfully')
        return newTokens.access_token
      }

      // Token is still fresh, decrypt and return
      return decrypt(connection.accessToken)
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to ensure fresh token:', error)
      throw error
    }
  }

  /**
   * Validate connection by testing token
   */
  async validateConnection(connectionId: string): Promise<boolean> {
    try {
      const accessToken = await this.ensureFreshToken(connectionId)
      const accountInfo = await this.getAccountInfo(accessToken)

      // Update last validated timestamp
      await db.updateHubSpotConnectionValidation(connectionId)

      console.log('✅ [HubSpot OAuth] Connection validated:', accountInfo.hub_id)
      return true
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Connection validation failed:', error)

      // Mark connection as inactive if validation fails
      await db.deactivateHubSpotConnection(connectionId)

      return false
    }
  }

  /**
   * Revoke connection and cleanup
   */
  async revokeConnection(connectionId: string): Promise<void> {
    try {
      // Simply deactivate in database
      // HubSpot doesn't require explicit token revocation
      await db.deactivateHubSpotConnection(connectionId)
      console.log('✅ [HubSpot OAuth] Connection revoked:', connectionId)
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to revoke connection:', error)
      throw error
    }
  }
}

// Export singleton instance
export const hubspotOAuthService = new HubSpotOAuthService()
