// User Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt: string
  creditBalance: number
  totalCreditsUsed: number
  isActive: boolean
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

// Configuration Types
export interface AppConfig {
  creditPacks: CreditPack[]
  freeSignupCredits: number
  maxSchemaGenerationsPerMinute: number
  maxRequestSizeBytes: number
}