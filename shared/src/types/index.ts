// User Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  organizationName?: string
  createdAt: string
  updatedAt: string
  creditBalance: number
  totalCreditsUsed: number
  isActive: boolean
  isAdmin?: boolean
}

// Credit Transaction Types
export interface CreditTransaction {
  id: string
  userId: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  description: string
  stripePaymentIntentId?: string
  createdAt: string
}

// URL Library Types
export interface UserDomain {
  id: string
  userId: string
  domain: string
  lastCrawledAt?: string
  totalUrlsDiscovered: number
  createdAt: string
  updatedAt: string
}

export interface DiscoveredUrl {
  id: string
  userId: string
  domainId?: string
  url: string
  path: string
  depth: number
  isHidden: boolean
  hasSchema: boolean
  lastSchemaGeneratedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SaveDiscoveredUrlsRequest {
  domain: string
  urls: Array<{
    url: string
    path: string
    depth: number
  }>
}

export interface UrlLibraryFilters {
  domainId?: string
  hasSchema?: boolean
  isHidden?: boolean
  search?: string
}

// Schema Generation Types
export interface SchemaGenerationRequest {
  url: string
  userId: string
  userAgent?: string
  ipAddress?: string
}

export interface ActionItem {
  id: string
  description: string
  priority: 'critical' | 'important' | 'nice-to-have'
  estimatedImpact: number // score points
  effort: 'quick' | 'medium' | 'major' // time estimate
  category: 'required' | 'recommended' | 'advanced' | 'content'
}

export interface SchemaScore {
  overallScore: number
  breakdown: {
    requiredProperties: number
    recommendedProperties: number
    advancedAEOFeatures: number
    contentQuality: number
  }
  suggestions: string[]
  strengths: string[]
  actionItems?: ActionItem[]
  contentIssues?: {
    lowWordCount?: boolean
    missingImages?: boolean
    noAuthorInfo?: boolean
    noDateInfo?: boolean
    poorMetadata?: boolean
  }
}

export interface SchemaGenerationResult {
  id: string
  userId: string
  url: string
  schemas: JsonLdSchema[]
  schemaScore?: SchemaScore
  status: 'success' | 'failed' | 'processing'
  errorMessage?: string
  creditsCost: number
  processingTimeMs: number
  createdAt: string
}

export interface JsonLdSchema {
  '@context': string | string[]
  '@type': string
  [key: string]: any
}

// Usage Analytics Types
export interface UsageAnalytics {
  id: string
  userId: string
  action: 'schema_generation' | 'schema_validation' | 'credit_purchase' | 'login' | 'signup'
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// Payment Types
export interface CreditPack {
  id: string
  name: string
  credits: number
  priceInCents: number
  savings?: number
  isPopular?: boolean
}

export interface PaymentIntent {
  id: string
  userId: string
  creditPackId: string
  stripePaymentIntentId: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  amountInCents: number
  credits: number
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Error Types
export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, any>
}

// Support Ticket Types
export interface SupportTicket {
  id: string
  userId: string
  userEmail: string
  userName: string
  category: 'general' | 'feature_request' | 'bug_report'
  message: string
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
  updatedAt: string
}

export interface CreateSupportTicketRequest {
  category: 'general' | 'feature_request' | 'bug_report'
  message: string
}

// HubSpot Integration Types
export interface HubSpotConnection {
  id: string
  userId: string
  hubspotPortalId: string
  portalName?: string
  region: string  // 'na1', 'eu1', or 'ap1'
  scopes: string[]
  associatedDomains?: string[]
  isActive: boolean
  lastValidatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface HubSpotSyncJob {
  id: string
  userId: string
  connectionId: string
  schemaGenerationId?: string
  hubspotContentId: string
  hubspotContentType: 'blog_post' | 'page' | 'landing_page'
  hubspotContentTitle?: string
  hubspotContentUrl?: string
  status: 'pending' | 'success' | 'failed' | 'retrying'
  errorMessage?: string
  retryCount: number
  syncedAt?: string
  createdAt: string
}

export interface HubSpotBlogPost {
  id: string
  name: string
  slug: string
  url: string
  state: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'
  publicAccessRulesEnabled: boolean
  publishDate?: string
  createdAt: string
  updatedAt: string
}

export interface HubSpotPage {
  id: string
  name: string
  slug: string
  url: string
  state: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'
  publicAccessRulesEnabled: boolean
  publishDate?: string
  createdAt: string
  updatedAt: string
}

export interface HubSpotContentMatchResult {
  contentId: string
  contentType: 'blog_post' | 'page' | 'landing_page'
  title: string
  url: string
  confidence: number // 0-1, how confident the match is
}

export interface PushSchemaToHubSpotRequest {
  connectionId: string
  contentId: string
  contentType: 'blog_post' | 'page' | 'landing_page'
  schemaHtml: string
  schemaGenerationId?: string
}

export interface HubSpotOAuthCallbackData {
  code: string
  state?: string
}

export interface AddDomainToConnectionRequest {
  domain: string
}

export interface RemoveDomainFromConnectionRequest {
  domain: string
}

export interface FindConnectionByDomainRequest {
  domain: string
}

// Release Notes Types
export interface ReleaseNote {
  id: string
  title: string
  description: string
  category: 'new_feature' | 'enhancement' | 'performance' | 'bug_fix'
  releaseDate: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReleaseNoteRequest {
  title: string
  description: string
  category: 'new_feature' | 'enhancement' | 'performance' | 'bug_fix'
  releaseDate: string
  isPublished?: boolean
}

export interface UpdateReleaseNoteRequest {
  title?: string
  description?: string
  category?: 'new_feature' | 'enhancement' | 'performance' | 'bug_fix'
  releaseDate?: string
  isPublished?: boolean
}

// Team Types
export interface Team {
  id: string
  ownerId: string
  organizationName?: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  invitedAt: string
  joinedAt: string
  isOwner: boolean
  isActive: boolean
  email?: string
  firstName?: string
  lastName?: string
  organizationName?: string
  teamCreatedAt?: string
}

export interface TeamInvite {
  inviteToken: string
  inviteUrl: string
  expiresAt: string
}

export interface TeamInviteDetails {
  id: string
  team_id: string
  invite_token: string
  created_by: string
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  users?: {
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface TeamInviteValidation {
  valid: boolean
  error?: string
  teamOwnerEmail?: string
  teamOwnerFirstName?: string
  teamOwnerLastName?: string
  organizationName?: string
  teamMemberCount?: number
  expiresAt?: string
}

export interface CreateTeamInviteRequest {
  teamId?: string
}

export interface AcceptTeamInviteRequest {
  token: string
}

export interface SwitchTeamRequest {
  teamId: string
}

export interface RemoveTeamMemberRequest {
  userId: string
}

export interface CurrentTeamResponse {
  team: Team
  members: TeamMember[]
  isOwner: boolean
}

export interface ListTeamsResponse {
  teams: TeamMember[]
  count: number
}

// Configuration Types
export interface AppConfig {
  creditPacks: CreditPack[]
  freeSignupCredits: number
  maxSchemaGenerationsPerMinute: number
  maxRequestSizeBytes: number
}