import { z } from 'zod'

// URL Validation Schema
export const urlSchema = z.string().url().min(1).max(2048).refine((url) => {
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}, 'URL must use HTTP or HTTPS protocol')

// Schema Generation Request Schema
export const schemaGenerationRequestSchema = z.object({
  url: urlSchema,
  options: z.object({
    includeImages: z.boolean().default(true),
    includeVideos: z.boolean().default(true),
    includeProducts: z.boolean().default(true),
    includeEvents: z.boolean().default(true),
    includeArticles: z.boolean().default(true),
    includeOrganization: z.boolean().default(true),
    includeLocalBusiness: z.boolean().default(true),
    requestedSchemaTypes: z.array(z.string()).optional(),
  }).optional()
})

// Schema Validation Request Schema
export const schemaValidationRequestSchema = z.object({
  schema: z.record(z.any()),
  strict: z.boolean().default(false)
})

// Credit Purchase Schema
export const creditPurchaseSchema = z.object({
  creditPackId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

// User Profile Update Schema
export const userProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional()
})

// Credit Transaction Schema
export const creditTransactionSchema = z.object({
  type: z.enum(['purchase', 'usage', 'refund', 'bonus']),
  amount: z.number().int(),
  description: z.string().min(1).max(255),
  stripePaymentIntentId: z.string().optional()
})

// Usage Analytics Schema
export const usageAnalyticsSchema = z.object({
  action: z.enum(['schema_generation', 'schema_validation', 'credit_purchase', 'login', 'signup']),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional()
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})

// Credit Pack Schema
export const creditPackSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1),
  priceInCents: z.number().int().min(1),
  savings: z.number().min(0).max(100).optional(),
  isPopular: z.boolean().default(false)
})

// JSON-LD Schema Validation
export const jsonLdSchemaSchema = z.object({
  '@context': z.union([z.string(), z.array(z.string())]),
  '@type': z.string(),
}).passthrough() // Allow additional properties

// API Response Schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

export const paginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
  })
})

// Export types inferred from schemas
export type SchemaGenerationRequest = z.infer<typeof schemaGenerationRequestSchema>
export type SchemaValidationRequest = z.infer<typeof schemaValidationRequestSchema>
export type CreditPurchaseRequest = z.infer<typeof creditPurchaseSchema>
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>
export type CreditTransactionInput = z.infer<typeof creditTransactionSchema>
export type UsageAnalyticsInput = z.infer<typeof usageAnalyticsSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type CreditPackInput = z.infer<typeof creditPackSchema>