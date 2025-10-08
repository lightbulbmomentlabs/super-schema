/**
 * HubSpot OAuth Service
 * Manages OAuth token lifecycle for HubSpot integration
 */

import axios from 'axios'
import { encrypt, decrypt } from '../encryption.js'
import { db } from '../database.js'

const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token'
const HUBSPOT_ACCOUNT_INFO_URL = 'https://api.hubapi.com/oauth/v1/access-tokens'

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
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<HubSpotTokenResponse> {
    try {
      console.log('🔄 [HubSpot OAuth] Exchanging code for tokens')

      const response = await axios.post<HubSpotTokenResponse>(
        HUBSPOT_TOKEN_URL,
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
          }
        }
      )

      console.log('✅ [HubSpot OAuth] Successfully exchanged code for tokens')
      return response.data
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to exchange code:', error)
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to exchange authorization code'
        )
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<HubSpotTokenResponse> {
    try {
      console.log('🔄 [HubSpot OAuth] Refreshing access token')

      const response = await axios.post<HubSpotTokenResponse>(
        HUBSPOT_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      console.log('✅ [HubSpot OAuth] Successfully refreshed access token')
      return response.data
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to refresh token:', error)
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
   */
  async getAccountInfo(accessToken: string): Promise<HubSpotAccountInfo> {
    try {
      const response = await axios.get<HubSpotAccountInfo>(
        `${HUBSPOT_ACCOUNT_INFO_URL}/${accessToken}`
      )
      return response.data
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to get account info:', error)
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to get account information'
        )
      }
      throw error
    }
  }

  /**
   * Store new connection in database
   */
  async storeConnection(
    userId: string,
    tokens: HubSpotTokenResponse,
    accountInfo: HubSpotAccountInfo
  ): Promise<string> {
    try {
      // Encrypt tokens before storage
      const encryptedAccessToken = encrypt(tokens.access_token)
      const encryptedRefreshToken = encrypt(tokens.refresh_token)

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      // Store in database
      const connectionId = await db.createHubSpotConnection({
        userId,
        hubspotPortalId: accountInfo.hub_id.toString(),
        portalName: accountInfo.hub_domain,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        scopes: accountInfo.scopes
      })

      console.log('✅ [HubSpot OAuth] Stored connection:', connectionId)
      return connectionId
    } catch (error) {
      console.error('❌ [HubSpot OAuth] Failed to store connection:', error)
      throw error
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

        // Get new tokens
        const newTokens = await this.refreshAccessToken(refreshToken)

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
