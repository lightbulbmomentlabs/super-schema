/**
 * Google Analytics 4 API Service
 * Client-side API calls for GA4 AI Crawler Analytics integration
 */

import { api } from './api'
import type { ApiResponse } from 'aeo-schema-generator-shared/types'

export interface GA4Connection {
  id: string
  scopes: string[]
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
  crawlerList: string[]
  topCrawlers: CrawlerStats[]
  topPages: PageCrawlerInfo[]
  dateRangeStart: string
  dateRangeEnd: string
}

export interface TrendDataPoint {
  date: string
  score: number
  crawlerCount: number
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
   */
  getConnectionStatus: async (): Promise<ApiResponse<{
    connected: boolean
    connection: GA4Connection | null
  }>> => {
    const response = await api.get('/ga4/connection')
    return response.data
  },

  /**
   * Disconnect GA4 and revoke access
   */
  disconnect: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/ga4/connection')
    return response.data
  },

  /**
   * List all GA4 properties accessible to the user
   */
  listProperties: async (): Promise<ApiResponse<{ properties: GA4Property[] }>> => {
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
  listDomainMappings: async (): Promise<ApiResponse<{ mappings: GA4DomainMapping[] }>> => {
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
  ): Promise<ApiResponse<{ metrics: GA4Metrics }>> => {
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
  ): Promise<ApiResponse<{
    metrics: GA4Metrics
    message: string
  }>> => {
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
  ): Promise<ApiResponse<{ trend: TrendDataPoint[] }>> => {
    const response = await api.get('/ga4/metrics/trend', {
      params: {
        propertyId,
        startDate,
        endDate
      }
    })
    return response.data
  }
}
