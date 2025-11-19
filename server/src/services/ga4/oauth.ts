/**
 * Google Analytics 4 OAuth Service
 * Manages OAuth token lifecycle for GA4 AI Crawler Analytics integration
 *
 * Uses Google's OAuth2 library for secure authentication and token management
 * Tokens are encrypted using AES-256-CBC before storage (same encryption as HubSpot)
 */

import { google } from 'googleapis'
import crypto from 'crypto'
import { encrypt, decrypt } from '../encryption.js'
import { db } from '../database.js'

const { OAuth2 } = google.auth

export interface GA4TokenResponse {
  access_token: string
  refresh_token?: string // Only present on first auth or when forced
  expiry_date?: number    // Unix timestamp in milliseconds
  token_type?: string
  scope?: string
}

export interface GA4ConnectionInfo {
  connectionId: string
  userId: string
  teamId?: string
  scopes: string[]
  connectedAt: Date
}

export class GA4OAuthService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private oauth2Client: InstanceType<typeof OAuth2>

  // Required scopes for GA4 AI Analytics
  private static readonly REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly'
  ]

  constructor() {
    this.clientId = process.env.GA4_CLIENT_ID || ''
    this.clientSecret = process.env.GA4_CLIENT_SECRET || ''
    this.redirectUri = process.env.GA4_REDIRECT_URI || ''

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('⚠️ [GA4 OAuth] Client ID, Secret, or Redirect URI not configured')
    }

    // Initialize OAuth2 client
    this.oauth2Client = new OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    )
  }

  /**
   * Generate authorization URL for user to grant GA4 access
   *
   * CRITICAL: Must set access_type: 'offline' and prompt: 'consent' to receive refresh token
   * Refresh tokens are ONLY issued on first authorization or when consent is forced
   */
  generateAuthUrl(userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',      // CRITICAL: Required for refresh tokens
      scope: GA4OAuthService.REQUIRED_SCOPES,
      state: this.generateStateParameter(userId), // CSRF protection
      prompt: 'consent',           // Force consent screen to ensure refresh token
      include_granted_scopes: true // Incremental authorization
    })

    console.log('🔐 [GA4 OAuth] Generated authorization URL for user:', userId)
    return authUrl
  }

  /**
   * Generate secure state parameter for CSRF protection
   * Encodes userId for callback validation
   */
  generateStateParameter(userId: string): string {
    // Generate 32 bytes of random data
    const randomBytes = crypto.randomBytes(32)
    const randomToken = randomBytes.toString('base64url')

    // Encode userId in state (base64url encoded JSON)
    const stateData = {
      userId,
      token: randomToken,
      timestamp: Date.now()
    }

    const stateJson = JSON.stringify(stateData)
    const stateToken = Buffer.from(stateJson).toString('base64url')

    console.log('🔐 [GA4 OAuth] Generated state parameter for user:', userId)
    return stateToken
  }

  /**
   * Decode and validate state parameter
   * Returns userId if valid, throws error if invalid
   */
  decodeStateParameter(state: string): { userId: string; timestamp: number } {
    try {
      const stateJson = Buffer.from(state, 'base64url').toString('utf-8')
      const stateData = JSON.parse(stateJson)

      // Validate timestamp (state valid for 10 minutes)
      const ageMs = Date.now() - stateData.timestamp
      if (ageMs > 10 * 60 * 1000) {
        throw new Error('State parameter expired (> 10 minutes old)')
      }

      return {
        userId: stateData.userId,
        timestamp: stateData.timestamp
      }
    } catch (error) {
      console.error('❌ [GA4 OAuth] Invalid state parameter:', error)
      throw new Error('Invalid state parameter')
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   *
   * CRITICAL: This must be called immediately after OAuth callback
   * Authorization codes expire quickly (typically 60 seconds)
   */
  async exchangeCodeForTokens(code: string): Promise<GA4TokenResponse> {
    const startTime = Date.now()

    try {
      console.log('🔄 [GA4 OAuth] Exchanging authorization code for tokens', {
        codePrefix: code.substring(0, 10) + '...',
        startTime: new Date(startTime).toISOString()
      })

      const { tokens } = await this.oauth2Client.getToken(code)

      const duration = Date.now() - startTime
      console.log('✅ [GA4 OAuth] Successfully exchanged code for tokens', {
        durationMs: duration,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Not set',
        scope: tokens.scope
      })

      if (!tokens.access_token) {
        throw new Error('No access token received from Google')
      }

      // CRITICAL: Verify refresh token was received
      if (!tokens.refresh_token) {
        console.warn('⚠️ [GA4 OAuth] No refresh token received. User may have already authorized this app.')
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ [GA4 OAuth] Failed to exchange code:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
        codePrefix: code.substring(0, 10) + '...'
      })

      if (error instanceof Error) {
        if (error.message.includes('invalid_grant')) {
          throw new Error('Authorization code expired or already used. Please try connecting again.')
        } else if (error.message.includes('redirect_uri_mismatch')) {
          throw new Error('OAuth redirect URI mismatch. Please contact support.')
        } else {
          throw new Error(`Failed to connect Google Analytics: ${error.message}`)
        }
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   * Automatically called when access token is near expiration
   */
  async refreshAccessToken(refreshToken: string): Promise<GA4TokenResponse> {
    try {
      console.log('🔄 [GA4 OAuth] Refreshing access token')

      // Set refresh token on client
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      })

      // Refresh tokens (automatically uses refresh token)
      const { credentials } = await this.oauth2Client.refreshAccessToken()

      console.log('✅ [GA4 OAuth] Successfully refreshed access token', {
        hasAccessToken: !!credentials.access_token,
        hasRefreshToken: !!credentials.refresh_token,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'Not set'
      })

      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date,
        token_type: credentials.token_type,
        scope: credentials.scope
      }
    } catch (error) {
      console.error('❌ [GA4 OAuth] Failed to refresh token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      if (error instanceof Error) {
        if (error.message.includes('invalid_grant')) {
          throw new Error('Refresh token expired or revoked. Please reconnect Google Analytics.')
        } else {
          throw new Error(`Failed to refresh access token: ${error.message}`)
        }
      }
      throw error
    }
  }

  /**
   * Get an authenticated OAuth2 client for API calls
   * Automatically refreshes tokens if needed
   */
  getAuthenticatedClient(accessToken: string, refreshToken: string, expiryDate?: number): InstanceType<typeof OAuth2> {
    const client = new OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    )

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate
    })

    // Listen for token refresh events
    client.on('tokens', (tokens) => {
      console.log('🔄 [GA4 OAuth] Tokens refreshed automatically', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      })

      // Note: Caller should listen to this event and update stored tokens
      // This is handled in the GA4 data service
    })

    return client
  }

  /**
   * Store GA4 connection in database with encrypted tokens
   */
  async storeConnection(
    userId: string,
    teamId: string | null,
    tokens: GA4TokenResponse,
    scopes: string[]
  ): Promise<string> {
    try {
      console.log('💾 [GA4 OAuth] Storing GA4 connection for user:', userId)

      // Encrypt tokens before storage
      const encryptedAccessToken = encrypt(tokens.access_token)
      const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null

      if (!encryptedRefreshToken) {
        throw new Error('Cannot store connection without refresh token')
      }

      // Calculate token expiry
      const tokenExpiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000) // Default 1 hour

      // Store in database
      const connectionId = await db.storeGA4Connection({
        userId,
        teamId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        scopes
      })

      console.log('✅ [GA4 OAuth] Successfully stored GA4 connection:', connectionId)
      return connectionId
    } catch (error) {
      console.error('❌ [GA4 OAuth] Failed to store connection:', error)
      throw new Error('Failed to save Google Analytics connection')
    }
  }

  /**
   * Get and decrypt stored tokens for a user
   */
  async getStoredTokens(userId: string): Promise<{
    accessToken: string
    refreshToken: string
    expiryDate?: number
  } | null> {
    try {
      const connection = await db.getGA4Connection(userId)

      if (!connection) {
        return null
      }

      // Decrypt tokens
      const accessToken = decrypt(connection.accessToken)
      const refreshToken = decrypt(connection.refreshToken)

      return {
        accessToken,
        refreshToken,
        expiryDate: connection.tokenExpiresAt ? connection.tokenExpiresAt.getTime() : undefined
      }
    } catch (error) {
      console.error('❌ [GA4 OAuth] Failed to retrieve stored tokens:', error)
      return null
    }
  }

  /**
   * Update stored tokens after refresh
   */
  async updateStoredTokens(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiryDate?: number
  ): Promise<void> {
    try {
      const encryptedAccessToken = encrypt(accessToken)
      const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : undefined

      await db.updateGA4Tokens(userId, {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiryDate ? new Date(expiryDate) : undefined
      })

      console.log('✅ [GA4 OAuth] Updated stored tokens for user:', userId)
    } catch (error) {
      console.error('❌ [GA4 OAuth] Failed to update tokens:', error)
      throw new Error('Failed to update tokens')
    }
  }

  /**
   * Revoke GA4 connection and delete stored tokens
   */
  async revokeConnection(userId: string): Promise<void> {
    try {
      console.log('🗑️ [GA4 OAuth] Revoking GA4 connection for user:', userId)

      // Get stored tokens
      const tokens = await this.getStoredTokens(userId)

      if (tokens) {
        // Revoke access token with Google
        try {
          await this.oauth2Client.revokeToken(tokens.accessToken)
          console.log('✅ [GA4 OAuth] Revoked access token with Google')
        } catch (error) {
          console.warn('⚠️ [GA4 OAuth] Failed to revoke token with Google (may already be revoked):', error)
        }
      }

      // Delete from database
      await db.deleteGA4Connection(userId)

      console.log('✅ [GA4 OAuth] Successfully revoked and deleted GA4 connection')
    } catch (error) {
      console.error('❌ [GA4 OAuth] Failed to revoke connection:', error)
      throw new Error('Failed to disconnect Google Analytics')
    }
  }

  /**
   * Check if tokens need refresh (within 5 minutes of expiry)
   */
  shouldRefreshToken(expiryDate?: number): boolean {
    if (!expiryDate) {
      return false
    }

    const now = Date.now()
    const expiryTime = expiryDate
    const fiveMinutes = 5 * 60 * 1000

    return (expiryTime - now) < fiveMinutes
  }
}

// Export singleton instance
export const ga4OAuth = new GA4OAuthService()
