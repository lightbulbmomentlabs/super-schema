import axios from 'axios'
import { authTokenManager } from '@/utils/authTokenManager'
import type {
  User,
  CreditTransaction,
  SchemaGenerationResult,
  PaginatedResponse,
  ApiResponse,
  JsonLdSchema,
  UserDomain,
  DiscoveredUrl,
  UrlLibraryFilters,
  SaveDiscoveredUrlsRequest,
  SupportTicket,
  CreateSupportTicketRequest,
  ReleaseNote,
  CreateReleaseNoteRequest,
  UpdateReleaseNoteRequest,
  TeamMember,
  TeamInvite,
  TeamInviteDetails,
  TeamInviteValidation,
  CurrentTeamResponse,
  ListTeamsResponse
} from '@shared/types'

// In production, API is served from same origin as the client (supports both superschema.ai and www.superschema.ai)
// In development, use VITE_API_URL from .env or default to localhost:3001
// Note: VITE_API_URL is intentionally not set in production to allow dynamic origin resolution
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3001')

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 120000, // 120 seconds (2 minutes) for schema generation
})

// Configure request interceptor at module load time
// This ensures the interceptor is ALWAYS active before any API calls are made
// The authTokenManager reference is updated by ApiProvider when auth state changes
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await authTokenManager.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('✅ [API] Auth token attached:', {
          url: config.url,
          method: config.method?.toUpperCase(),
          hasToken: true,
          tokenPreview: token.substring(0, 20) + '...',
          authStatus: authTokenManager.getStatus()
        })
      } else {
        console.warn('⚠️ [API] No auth token available:', {
          url: config.url,
          method: config.method?.toUpperCase(),
          authStatus: authTokenManager.getStatus()
        })
      }
    } catch (error) {
      console.error('❌ [API] Failed to get auth token:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        error: error instanceof Error ? error.message : 'Unknown error',
        authStatus: authTokenManager.getStatus()
      })
    }
    return config
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Configure response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API] Response received:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    })
    return response
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url

    console.error('❌ [API] Response error:', {
      url,
      method: error.config?.method?.toUpperCase(),
      status,
      statusText: error.response?.statusText,
      errorMessage: error.message,
      authStatus: authTokenManager.getStatus()
    })

    if (status === 401) {
      console.warn('🚫 [API] 401 Unauthorized - Redirecting to sign-in')
      // Handle unauthorized - redirect to login
      window.location.href = '/sign-in'
    }

    return Promise.reject(error)
  }
)

console.log('🔧 [API] Axios interceptors configured at module load time')

// Custom hook to get authenticated API instance
export const useApi = () => {
  return api
}

// API Service Class
// Auth headers are automatically added by ApiProvider.tsx interceptor
class ApiService {

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/user/profile')
    return response.data
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put('/user/profile', data)
    return response.data
  }

  async initializeUser(data: {
    email: string
    firstName?: string
    lastName?: string
  }): Promise<ApiResponse<User>> {
    const response = await api.post('/user/init', data)
    return response.data
  }

  async getCredits(): Promise<ApiResponse<{ creditBalance: number; totalCreditsUsed: number }>> {
    const response = await api.get('/user/credits')
    return response.data
  }

  async getCreditTransactions(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<CreditTransaction>>> {
    const response = await api.get('/user/transactions', {
      params: { page, limit }
    })
    return response.data
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    const response = await api.get('/user/stats')
    return response.data
  }

  // Schema generation endpoints
  async generateSchema(url: string, options?: any): Promise<ApiResponse<{
    schemas: JsonLdSchema[]
    metadata: any
    validationResults: any[]
    htmlScriptTags?: string
    schemaScore?: any
    urlId?: string
  }>> {
    // Extract schemaType from options.requestedSchemaTypes for backend
    const schemaType = options?.requestedSchemaTypes?.[0] || 'Auto'

    const response = await api.post('/schema/generate', {
      url,
      schemaType,  // Send at top level for backend
      options
    })
    return response.data
  }

  async batchGenerateSchemas(urls: string[], options?: any): Promise<ApiResponse<{
    results: any[]
    summary: any
  }>> {
    const response = await api.post('/schema/batch-generate', {
      urls,
      options
    })
    return response.data
  }

  async validateSchema(schema: JsonLdSchema, strict = false): Promise<ApiResponse<{
    isValid: boolean
    errors: any[]
    warnings: any[]
    schema?: JsonLdSchema
  }>> {
    const response = await api.post('/schema/validate', {
      schema,
      strict
    })
    return response.data
  }

  async validateMultipleSchemas(schemas: JsonLdSchema[]): Promise<ApiResponse<{
    isValid: boolean
    results: any[]
    summary: any
  }>> {
    const response = await api.post('/schema/validate-multiple', {
      schemas
    })
    return response.data
  }

  async refineSchema(schemas: JsonLdSchema[], url: string, options?: any, schemaId?: string): Promise<ApiResponse<{
    schemas: JsonLdSchema[]
    htmlScriptTags?: string
    schemaScore: any
    metadata: any
    refinementCount?: number
    remainingRefinements?: number
    highlightedChanges?: any[]
  }>> {
    const response = await api.post('/schema/refine', {
      schemas,
      url,
      options,
      schemaId
    })
    return response.data
  }

  async refineLibrarySchema(schemaId: string, schemas: JsonLdSchema[], url: string, options?: any): Promise<ApiResponse<{
    schemas: JsonLdSchema[]
    htmlScriptTags?: string
    schemaScore: any
    metadata: any
    highlightedChanges: string[]
    refinementCount: number
    remainingRefinements: number
  }>> {
    const response = await api.post('/schema/refine-library', {
      schemaId,
      schemas,
      url,
      options
    })
    return response.data
  }

  async getGenerationHistory(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<SchemaGenerationResult>>> {
    const response = await api.get('/schema/history', {
      params: { page, limit }
    })
    return response.data
  }

  async getGenerationStats(): Promise<ApiResponse<any>> {
    const response = await api.get('/schema/stats')
    return response.data
  }

  async getGenerationInsights(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any>> {
    const response = await api.get('/schema/insights', {
      params: { timeframe }
    })
    return response.data
  }

  async extractSchemaFromUrl(url: string): Promise<ApiResponse<{
    url: string
    schemas: JsonLdSchema[]
    schemasFound: number
    metadata: {
      title: string
      description: string
    }
  }>> {
    const response = await api.post('/schema/extract', {
      url
    })
    return response.data
  }

  // Credit pack endpoints
  async getCreditPacks(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/payment/credit-packs')
    return response.data
  }

  async createPaymentIntent(creditPackId: string): Promise<ApiResponse<{
    clientSecret: string
    paymentIntentId: string
  }>> {
    const response = await api.post('/payment/create-intent', {
      creditPackId
    })
    return response.data
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<{
    success: boolean
    message: string
    creditsAdded?: number
  }>> {
    const response = await api.post('/payment/confirm', {
      paymentIntentId
    })
    return response.data
  }

  async getPaymentHistory(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<any>>> {
    const response = await api.get('/payment/history', {
      params: { page, limit }
    })
    return response.data
  }

  async getPaymentConfig(): Promise<ApiResponse<{ publishableKey: string }>> {
    const response = await api.get('/payment/config')
    return response.data
  }

  // Model testing endpoints
  async getAvailableModels(): Promise<ApiResponse<{
    models: Array<{
      value: string
      label: string
      description: string
      cost: string
      capabilities: string[]
      recommended?: boolean
      experimental?: boolean
    }>
    currentModel: string
  }>> {
    const response = await api.get('/model-test/models')
    return response.data
  }

  async testModelPerformance(model: string, url: string, options?: any): Promise<ApiResponse<{
    model: string
    responseTime: number
    schemas: JsonLdSchema[]
    metadata: any
    validationResults: any[]
    schemaScore?: any
  }>> {
    const response = await api.post('/model-test/test', {
      model,
      url,
      options
    })
    return response.data
  }

  async switchModel(model: string): Promise<ApiResponse<{
    model: string
    message: string
  }>> {
    const response = await api.post('/model-test/switch', {
      model
    })
    return response.data
  }

  // Crawler endpoints
  async discoverUrls(domain: string): Promise<ApiResponse<{
    crawlId: string
    urls: Array<{ url: string; path: string; depth: number }>
    totalFound: number
    status: string
    hasMore: boolean
  }>> {
    const response = await api.post('/crawler/discover', {
      domain
    })
    return response.data
  }

  async getCrawlResults(crawlId: string): Promise<ApiResponse<{
    crawlId: string
    urls: Array<{ url: string; path: string; depth: number }>
    totalFound: number
    status: string
    hasMore: boolean
  }>> {
    const response = await api.get(`/crawler/results/${crawlId}`)
    return response.data
  }

  async getCachedCrawl(domain: string): Promise<ApiResponse<{
    crawlId: string
    urls: Array<{ url: string; path: string; depth: number }>
    totalFound: number
    status: string
    cached: boolean
  } | null>> {
    const response = await api.get(`/crawler/cached/${encodeURIComponent(domain)}`)
    return response.data
  }

  // URL Library endpoints
  async getUserDomains(): Promise<ApiResponse<UserDomain[]>> {
    const response = await api.get('/library/domains')
    return response.data
  }

  async saveDiscoveredUrls(data: SaveDiscoveredUrlsRequest): Promise<ApiResponse<{
    domain: UserDomain
    urlCount: number
  }>> {
    const response = await api.post('/library/urls', data)
    return response.data
  }

  async getUserUrls(filters?: UrlLibraryFilters): Promise<ApiResponse<DiscoveredUrl[]>> {
    const response = await api.get('/library/urls', {
      params: filters
    })
    return response.data
  }

  async hideUrl(urlId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.put(`/library/urls/${urlId}/hide`)
    return response.data
  }

  async unhideUrl(urlId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.put(`/library/urls/${urlId}/unhide`)
    return response.data
  }

  async deleteDomain(domainId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/library/domains/${domainId}`)
    return response.data
  }

  async getUrlSchema(urlId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/library/urls/${urlId}/schema`)
    return response.data
  }

  async getAllUrlSchemas(urlId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/library/urls/${urlId}/schemas`)
    return response.data
  }

  async updateUrlSchema(urlId: string, schemas: any[]): Promise<ApiResponse<{ message: string }>> {
    const response = await api.put(`/library/urls/${urlId}/schema`, { schemas })
    return response.data
  }

  async deleteUrl(urlId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/library/urls/${urlId}`)
    return response.data
  }

  async deleteSchemaType(schemaId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/schema/${schemaId}`)
    return response.data
  }

  async checkUrlExists(url: string): Promise<ApiResponse<{
    exists: boolean
    urlId?: string
    createdAt?: string
    hasSchema: boolean
  }>> {
    const response = await api.get('/library/check-url', {
      params: { url }
    })
    return response.data
  }

  // Admin endpoints
  async getPlatformStats(): Promise<ApiResponse<{
    totalUsers: number
    activeUsers: number
    totalSchemas: number
    totalCreditsDistributed: number
    totalCreditsUsed: number
  }>> {
    const response = await api.get('/admin/stats')
    return response.data
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const response = await api.get('/admin/users/search', {
      params: { query }
    })
    return response.data
  }

  async getAllUsers(limit = 50, offset = 0): Promise<ApiResponse<User[]>> {
    const response = await api.get('/admin/users', {
      params: { limit, offset }
    })
    return response.data
  }

  async getUserDetails(userId: string): Promise<ApiResponse<{
    user: User
    activity: any[]
    stats: any
  }>> {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  }

  async deleteUserCompletely(userId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  }

  async modifyUserCredits(userId: string, amount: number, reason: string): Promise<ApiResponse<{
    data: User
    message: string
  }>> {
    const response = await api.post('/admin/users/credits', {
      userId,
      amount,
      reason
    })
    return response.data
  }

  // Support ticket endpoints
  async createSupportTicket(data: CreateSupportTicketRequest): Promise<ApiResponse<SupportTicket>> {
    const response = await api.post('/support/tickets', data)
    return response.data
  }

  async getSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    const response = await api.get('/support/tickets')
    return response.data
  }

  async deleteSupportTicket(ticketId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/support/tickets/${ticketId}`)
    return response.data
  }

  async batchDeleteSupportTickets(ticketIds: string[]): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/support/tickets/batch-delete', { ticketIds })
    return response.data
  }

  // Team endpoints
  async listTeams(): Promise<ApiResponse<ListTeamsResponse>> {
    const response = await api.get('/team/list')
    return response.data
  }

  async getCurrentTeam(): Promise<ApiResponse<CurrentTeamResponse>> {
    const response = await api.get('/team/current')
    return response.data
  }

  async switchTeam(teamId: string): Promise<ApiResponse<{ activeTeamId: string; message: string }>> {
    const response = await api.post(`/team/switch/${teamId}`)
    return response.data
  }

  async createTeamInvite(): Promise<ApiResponse<TeamInvite>> {
    const response = await api.post('/team/invite')
    return response.data
  }

  async validateTeamInvite(token: string): Promise<ApiResponse<{ valid: boolean } & TeamInviteValidation>> {
    const response = await api.get(`/team/invite/${token}`)
    return response.data
  }

  async acceptTeamInvite(token: string): Promise<ApiResponse<{ teamId: string; message: string }>> {
    const response = await api.post(`/team/join/${token}`)
    return response.data
  }

  async getTeamMembers(): Promise<ApiResponse<{ members: TeamMember[]; teamId: string; ownerId: string }>> {
    const response = await api.get('/team/members')
    return response.data
  }

  async removeTeamMember(userId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/team/members/${userId}`)
    return response.data
  }

  async leaveTeam(): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/team/leave')
    return response.data
  }

  async getTeamInvites(): Promise<ApiResponse<TeamInviteDetails[]>> {
    const response = await api.get('/team/invites')
    return response.data
  }

  async deleteTeamInvite(inviteId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/team/invite/${inviteId}`)
    return response.data
  }

  // Release notes endpoints
  async getReleaseNotes(): Promise<ApiResponse<ReleaseNote[]>> {
    const response = await api.get('/release-notes')
    return response.data
  }

  // Admin release notes endpoints
  async getAllReleaseNotes(): Promise<ApiResponse<ReleaseNote[]>> {
    const response = await api.get('/release-notes/admin/all')
    return response.data
  }

  async createReleaseNote(data: CreateReleaseNoteRequest): Promise<ApiResponse<ReleaseNote>> {
    const response = await api.post('/release-notes/admin', data)
    return response.data
  }

  async updateReleaseNote(noteId: string, data: UpdateReleaseNoteRequest): Promise<ApiResponse<ReleaseNote>> {
    const response = await api.put(`/release-notes/admin/${noteId}`, data)
    return response.data
  }

  async deleteReleaseNote(noteId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/release-notes/admin/${noteId}`)
    return response.data
  }
}

export const apiService = new ApiService()

// React Query hooks for common operations
export const useApiQuery = () => {
  const api = useApi()
  return api
}