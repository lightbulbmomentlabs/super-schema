/**
 * Google Analytics 4 API Service
 * Client-side API calls for GA4 AI Crawler Analytics integration
 */

import { api } from './api'
import type { ApiResponse } from 'aeo-schema-generator-shared/types'

// Note: GA4 API endpoints return data at root level (e.g., { success, metrics })
// not nested under 'data' like the generic ApiResponse<T> suggests.
// We use GA4-specific response types (GA4MetricsResponse, etc.) for type safety.

export interface GA4Connection {
  id: string
  googleAccountEmail: string | null
  scopes: string[]
  isActive: boolean
  connectedAt: string
  lastValidatedAt: string | null
}

export interface GA4Property {
  id: string
  name: string
}

export interface GA4DomainMapping {
  id: string
  userId: string
  teamId: string | null
  connectionId: string
  propertyId: string
  propertyName: string
  domain: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CrawlerStats {
  name: string
  sessions: number
  pageViews: number
  uniquePages: number
}

export interface PageCrawlerInfo {
  path: string
  crawlerCount: number
  crawlers: string[]
  sessions: number
  lastCrawled: string // ISO date string of most recent crawl
}

export interface GA4Metrics {
  aiVisibilityScore: number
  aiDiversityScore: number
  coveragePercentage: number
  totalPages: number
  aiCrawledPages: number
  ignoredPagesCount: number
  crawlerList: string[]
  topCrawlers: CrawlerStats[]
  topPages: PageCrawlerInfo[]
  nonCrawledPages: string[] // Pages with traffic but no AI referral traffic
  dateRangeStart: string
  dateRangeEnd: string
  scoreBreakdown?: {
    diversityPoints: number      // 0-40 points
    coveragePoints: number        // 0-40 points
    volumePoints: number          // 0-20 points
    totalAiSessions: number       // Raw count for reference
  }
}

export interface TrendDataPoint {
  date: string
  score: number
  crawlerCount: number
}

export interface ActivitySnapshot {
  date: string
  aiSessions: number
  uniqueCrawlers: number
  aiCrawledPages: number
  totalActivePages: number
  crawlerList: string[]
}

export type ExclusionPatternType = 'exact' | 'prefix' | 'suffix' | 'regex'
export type ExclusionCategory = 'auth' | 'callback' | 'static' | 'admin' | 'api' | 'custom'

export interface ExclusionPattern {
  id: string
  mappingId: string
  pattern: string
  patternType: ExclusionPatternType
  category: ExclusionCategory
  description: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: string
  createdBy: string | null
}

/**
 * GA4-specific API response types
 * These match the actual backend response structure where data is at root level
 * (not nested under 'data' like the generic ApiResponse<T> suggests)
 */
export interface GA4BaseResponse {
  success: boolean
  error?: string
}

export interface GA4MetricsResponse extends GA4BaseResponse {
  metrics: GA4Metrics
}

export interface GA4ActivitySnapshotsResponse extends GA4BaseResponse {
  snapshots: ActivitySnapshot[]
}

export interface GA4ConnectionResponse extends GA4BaseResponse {
  connected: boolean
  connections: GA4Connection[]
  activeConnection: GA4Connection | null
}

export interface GA4PropertiesResponse extends GA4BaseResponse {
  properties: GA4Property[]
}

export interface GA4MappingsResponse extends GA4BaseResponse {
  mappings: GA4DomainMapping[]
}

export interface GA4TrendResponse extends GA4BaseResponse {
  trend: TrendDataPoint[]
}

export interface GA4ExclusionsResponse extends GA4BaseResponse {
  patterns: ExclusionPattern[]
}

export const ga4Api = {
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl: async (): Promise<ApiResponse<{ authUrl: string }>> => {
    const response = await api.get('/ga4/auth-url')
    return response.data
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  handleCallback: async (
    code: string,
    state: string
  ): Promise<ApiResponse<{
    connectionId: string
    message: string
  }>> => {
    const response = await api.post('/ga4/callback', {
      code,
      state
    })
    return response.data
  },

  /**
   * Get current GA4 connection status
   * Returns all connections and the currently active one
   */
  getConnectionStatus: async (): Promise<GA4ConnectionResponse> => {
    const response = await api.get('/ga4/connection')
    return response.data
  },

  /**
   * Disconnect a specific GA4 connection
   */
  disconnect: async (connectionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/ga4/connection/${connectionId}`)
    return response.data
  },

  /**
   * Set a connection as the active one
   */
  setActiveConnection: async (connectionId: string): Promise<ApiResponse<{
    message: string
    connectionId: string
  }>> => {
    const response = await api.post(`/ga4/connection/${connectionId}/activate`)
    return response.data
  },

  /**
   * List all GA4 properties accessible to the user
   */
  listProperties: async (): Promise<GA4PropertiesResponse> => {
    const response = await api.get('/ga4/properties')
    return response.data
  },

  /**
   * Create a domain mapping to a GA4 property
   */
  createDomainMapping: async (
    propertyId: string,
    propertyName: string,
    domain: string
  ): Promise<ApiResponse<{
    mappingId: string
    message: string
  }>> => {
    const response = await api.post('/ga4/domain-mapping', {
      propertyId,
      propertyName,
      domain
    })
    return response.data
  },

  /**
   * List all domain mappings for the user
   */
  listDomainMappings: async (): Promise<GA4MappingsResponse> => {
    const response = await api.get('/ga4/domain-mappings')
    return response.data
  },

  /**
   * Delete a domain mapping
   */
  deleteDomainMapping: async (mappingId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/ga4/domain-mapping/${mappingId}`)
    return response.data
  },

  /**
   * Get AI crawler metrics for a property
   */
  getMetrics: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<GA4MetricsResponse> => {
    const response = await api.get('/ga4/metrics', {
      params: {
        propertyId,
        startDate,
        endDate
      }
    })
    return response.data
  },

  /**
   * Refresh AI crawler metrics (force API call)
   */
  refreshMetrics: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<GA4MetricsResponse & { message: string }> => {
    const response = await api.post('/ga4/metrics/refresh', {
      propertyId,
      startDate,
      endDate
    })
    return response.data
  },

  /**
   * Get AI Visibility Score trend over time
   */
  getTrend: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<GA4TrendResponse> => {
    const response = await api.get('/ga4/metrics/trend', {
      params: {
        propertyId,
        startDate,
        endDate
      }
    })
    return response.data
  },

  /**
   * Get daily activity snapshots for trend visualization
   * Returns raw metrics (sessions, crawlers, pages) for each day
   */
  getActivitySnapshots: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<GA4ActivitySnapshotsResponse> => {
    const response = await api.get('/ga4/metrics/activity-snapshots', {
      params: {
        propertyId,
        startDate,
        endDate
      }
    })
    return response.data
  },

  /**
   * List exclusion patterns for a domain mapping
   */
  listExclusionPatterns: async (mappingId: string): Promise<GA4ExclusionsResponse> => {
    const response = await api.get(`/ga4/domain-mapping/${mappingId}/exclusions`)
    return response.data
  },

  /**
   * Create a new exclusion pattern
   */
  createExclusionPattern: async (
    mappingId: string,
    pattern: string,
    patternType: ExclusionPatternType,
    category: ExclusionCategory,
    description?: string
  ): Promise<ApiResponse<{ patternId: string; message: string }>> => {
    const response = await api.post(`/ga4/domain-mapping/${mappingId}/exclusions`, {
      pattern,
      patternType,
      category,
      description
    })
    return response.data
  },

  /**
   * Update an existing exclusion pattern
   */
  updateExclusionPattern: async (
    mappingId: string,
    patternId: string,
    updates: {
      pattern?: string
      patternType?: ExclusionPatternType
      category?: ExclusionCategory
      description?: string
    }
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/ga4/domain-mapping/${mappingId}/exclusions/${patternId}`, updates)
    return response.data
  },

  /**
   * Delete an exclusion pattern
   */
  deleteExclusionPattern: async (
    mappingId: string,
    patternId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/ga4/domain-mapping/${mappingId}/exclusions/${patternId}`)
    return response.data
  },

  /**
   * Toggle an exclusion pattern on/off
   */
  toggleExclusionPattern: async (
    mappingId: string,
    patternId: string,
    isActive: boolean
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/ga4/domain-mapping/${mappingId}/exclusions/${patternId}/toggle`, {
      isActive
    })
    return response.data
  }
}
