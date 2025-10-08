/**
 * HubSpot API Service
 * Client-side API calls for HubSpot integration
 */

import { api } from './api'
import type {
  HubSpotConnection,
  HubSpotBlogPost,
  HubSpotPage,
  HubSpotContentMatchResult,
  PushSchemaToHubSpotRequest,
  ApiResponse
} from 'aeo-schema-generator-shared/types'

export const hubspotApi = {
  /**
   * Handle OAuth callback (exchange code for tokens)
   * @param authToken - Clerk auth token (must be provided explicitly for callback)
   */
  handleCallback: async (
    code: string,
    authToken: string,
    redirectUri?: string
  ): Promise<ApiResponse<{
    connectionId: string
    portalId: number
    portalName: string
    scopes: string[]
  }>> => {
    const response = await api.post('/hubspot/callback', {
      code,
      redirectUri
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
    return response.data
  },

  /**
   * Get user's HubSpot connections
   */
  getConnections: async (): Promise<ApiResponse<HubSpotConnection[]>> => {
    const response = await api.get('/hubspot/connections')
    return response.data
  },

  /**
   * Validate a HubSpot connection
   */
  validateConnection: async (connectionId: string): Promise<ApiResponse<{
    isValid: boolean
    connectionId: string
  }>> => {
    const response = await api.get(`/hubspot/connections/${connectionId}/validate`)
    return response.data
  },

  /**
   * Disconnect HubSpot account
   */
  disconnectAccount: async (connectionId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/hubspot/connections/${connectionId}`)
    return response.data
  },

  /**
   * List blog posts for connected portal
   */
  listBlogPosts: async (connectionId: string): Promise<ApiResponse<HubSpotBlogPost[]>> => {
    const response = await api.get('/hubspot/content/posts', {
      params: { connectionId }
    })
    return response.data
  },

  /**
   * List pages for connected portal
   */
  listPages: async (connectionId: string): Promise<ApiResponse<HubSpotPage[]>> => {
    const response = await api.get('/hubspot/content/pages', {
      params: { connectionId }
    })
    return response.data
  },

  /**
   * Match URL to HubSpot content
   */
  matchContent: async (
    connectionId: string,
    url: string
  ): Promise<ApiResponse<HubSpotContentMatchResult[]>> => {
    const response = await api.get('/hubspot/content/match', {
      params: { connectionId, url }
    })
    return response.data
  },

  /**
   * Push schema to HubSpot content
   */
  pushSchema: async (request: PushSchemaToHubSpotRequest): Promise<ApiResponse<{
    syncJobId: string
    contentId: string
    contentType: string
  }>> => {
    const response = await api.post('/hubspot/sync/push', request)
    return response.data
  },

  /**
   * Get sync history for user
   */
  getSyncHistory: async (limit?: number, offset?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/hubspot/sync/history', {
      params: { limit, offset }
    })
    return response.data
  },

  /**
   * Add domain to HubSpot connection
   */
  addDomainToConnection: async (connectionId: string, domain: string): Promise<ApiResponse> => {
    const response = await api.patch(`/hubspot/connections/${connectionId}/domains/add`, {
      domain
    })
    return response.data
  },

  /**
   * Remove domain from HubSpot connection
   */
  removeDomainFromConnection: async (connectionId: string, domain: string): Promise<ApiResponse> => {
    const response = await api.patch(`/hubspot/connections/${connectionId}/domains/remove`, {
      domain
    })
    return response.data
  },

  /**
   * Find HubSpot connection by domain
   */
  findConnectionByDomain: async (domain: string): Promise<ApiResponse<HubSpotConnection | null>> => {
    const response = await api.get(`/hubspot/connections/for-domain/${domain}`)
    return response.data
  }
}
