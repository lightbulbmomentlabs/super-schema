// IMPORTANT: Load environment variables FIRST
import '../config/env.js'

import { createClient } from '@supabase/supabase-js'
import type {
  Organization,
  OrganizationAddress,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationCompleteness
} from '../../../shared/src/types/index.js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// =============================================================================
// INTERNAL TYPES (Database row format)
// =============================================================================

interface OrganizationRow {
  id: string
  team_id: string
  name: string
  url: string | null
  logo_url: string | null
  street_address: string | null
  address_locality: string | null
  address_region: string | null
  postal_code: string | null
  address_country: string | null
  telephone: string | null
  email: string | null
  same_as: string[] | null
  associated_domains: string[] | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// HELPERS: Transform between DB rows and API types
// =============================================================================

function rowToOrganization(row: OrganizationRow): Organization {
  const hasAddress = row.street_address || row.address_locality ||
    row.address_region || row.postal_code || row.address_country

  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    url: row.url || undefined,
    logoUrl: row.logo_url || undefined,
    address: hasAddress ? {
      streetAddress: row.street_address || undefined,
      addressLocality: row.address_locality || undefined,
      addressRegion: row.address_region || undefined,
      postalCode: row.postal_code || undefined,
      addressCountry: row.address_country || undefined
    } : undefined,
    telephone: row.telephone || undefined,
    email: row.email || undefined,
    sameAs: row.same_as || undefined,
    associatedDomains: row.associated_domains || undefined,
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function requestToInsertData(
  teamId: string,
  request: CreateOrganizationRequest
): Partial<OrganizationRow> {
  return {
    team_id: teamId,
    name: request.name,
    url: request.url || null,
    logo_url: request.logoUrl || null,
    street_address: request.address?.streetAddress || null,
    address_locality: request.address?.addressLocality || null,
    address_region: request.address?.addressRegion || null,
    postal_code: request.address?.postalCode || null,
    address_country: request.address?.addressCountry || null,
    telephone: request.telephone || null,
    email: request.email || null,
    same_as: request.sameAs || [],
    associated_domains: request.associatedDomains || [],
    is_default: request.isDefault || false
  }
}

function requestToUpdateData(
  request: UpdateOrganizationRequest
): Partial<OrganizationRow> {
  const data: Partial<OrganizationRow> = {}

  if (request.name !== undefined) data.name = request.name
  if (request.url !== undefined) data.url = request.url || null
  if (request.logoUrl !== undefined) data.logo_url = request.logoUrl || null
  if (request.telephone !== undefined) data.telephone = request.telephone || null
  if (request.email !== undefined) data.email = request.email || null
  if (request.sameAs !== undefined) data.same_as = request.sameAs || []
  if (request.associatedDomains !== undefined) data.associated_domains = request.associatedDomains || []
  if (request.isDefault !== undefined) data.is_default = request.isDefault

  // Handle nested address object
  if (request.address !== undefined) {
    data.street_address = request.address?.streetAddress || null
    data.address_locality = request.address?.addressLocality || null
    data.address_region = request.address?.addressRegion || null
    data.postal_code = request.address?.postalCode || null
    data.address_country = request.address?.addressCountry || null
  }

  return data
}

// =============================================================================
// COMPLETENESS CALCULATION
// =============================================================================

/**
 * Calculate organization profile completeness score
 */
export function calculateCompleteness(org: Organization): OrganizationCompleteness {
  const fields = [
    { name: 'name', filled: !!org.name, weight: 15 },
    { name: 'url', filled: !!org.url, weight: 10 },
    { name: 'logoUrl', filled: !!org.logoUrl, weight: 10 },
    { name: 'streetAddress', filled: !!org.address?.streetAddress, weight: 10 },
    { name: 'addressLocality', filled: !!org.address?.addressLocality, weight: 8 },
    { name: 'addressRegion', filled: !!org.address?.addressRegion, weight: 7 },
    { name: 'postalCode', filled: !!org.address?.postalCode, weight: 5 },
    { name: 'addressCountry', filled: !!org.address?.addressCountry, weight: 5 },
    { name: 'telephone', filled: !!org.telephone, weight: 10 },
    { name: 'email', filled: !!org.email, weight: 10 },
    { name: 'sameAs', filled: (org.sameAs?.length || 0) > 0, weight: 5 },
    { name: 'associatedDomains', filled: (org.associatedDomains?.length || 0) > 0, weight: 5 }
  ]

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
  const filledWeight = fields
    .filter(f => f.filled)
    .reduce((sum, f) => sum + f.weight, 0)

  const score = Math.round((filledWeight / totalWeight) * 100)

  return {
    score,
    filledFields: fields.filter(f => f.filled).map(f => f.name),
    missingFields: fields.filter(f => !f.filled).map(f => f.name)
  }
}

// =============================================================================
// ERROR CODE CONSTANTS (Fix #30: Define magic strings as constants)
// =============================================================================

const POSTGRES_ERROR_CODES = {
  /** No rows returned from single-row query */
  NOT_FOUND: 'PGRST116'
} as const

// =============================================================================
// ERROR MESSAGE CONSTANTS (Fix #23: Standardize error messages)
// =============================================================================

const ERROR_MESSAGES = {
  NOT_FOUND: 'Organization not found or access denied',
  LIST_FAILED: 'Failed to list organizations',
  GET_FAILED: 'Failed to get organization',
  CREATE_FAILED: 'Failed to create organization',
  UPDATE_FAILED: 'Failed to update organization',
  DELETE_FAILED: 'Failed to delete organization',
  SET_DEFAULT_FAILED: 'Failed to set default organization',
  NOT_FOUND_AFTER_UPDATE: 'Organization not found after update'
} as const

// =============================================================================
// PAGINATION TYPES (Fix #13: Add pagination support)
// =============================================================================

export interface ListOrganizationsOptions {
  limit?: number
  offset?: number
}

export interface PaginatedOrganizations {
  data: Organization[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 100

/**
 * List all organizations for a team with optional pagination (Fix #13)
 */
export async function listOrganizations(
  teamId: string,
  options: ListOrganizationsOptions = {}
): Promise<PaginatedOrganizations> {
  const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const offset = options.offset || 0

  // Get total count first for pagination metadata
  const { count, error: countError } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('is_active', true)

  if (countError) {
    throw new Error(`${ERROR_MESSAGES.LIST_FAILED}: ${countError.message}`)
  }

  const total = count || 0

  // Get paginated data
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`${ERROR_MESSAGES.LIST_FAILED}: ${error.message}`)
  }

  return {
    data: (data || []).map(rowToOrganization),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total
    }
  }
}

/**
 * Get a single organization by ID
 * SECURITY: Always requires teamId to prevent cross-tenant data access
 */
export async function getOrganization(orgId: string, teamId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .eq('team_id', teamId)  // CRITICAL: Always filter by team_id for security
    .single()

  if (error) {
    if (error.code === POSTGRES_ERROR_CODES.NOT_FOUND) {
      return null
    }
    throw new Error(`${ERROR_MESSAGES.GET_FAILED}: ${error.message}`)
  }

  return rowToOrganization(data)
}

/**
 * Get default organization for a team
 */
export async function getDefaultOrganization(teamId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_default', true)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === POSTGRES_ERROR_CODES.NOT_FOUND) {
      return null
    }
    throw new Error(`${ERROR_MESSAGES.GET_FAILED}: ${error.message}`)
  }

  return rowToOrganization(data)
}

/**
 * Create a new organization
 */
export async function createOrganization(
  teamId: string,
  request: CreateOrganizationRequest
): Promise<Organization> {
  // Create the organization first (without is_default if requested)
  // Then use atomic RPC to set default if needed
  const insertData = requestToInsertData(teamId, request)

  // Always insert with is_default=false, then use atomic RPC if needed
  const shouldBeDefault = request.isDefault
  insertData.is_default = false

  const { data, error } = await supabase
    .from('organizations')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`${ERROR_MESSAGES.CREATE_FAILED}: ${error.message}`)
  }

  // If this should be default, use atomic RPC function
  if (shouldBeDefault) {
    const { error: rpcError } = await supabase.rpc('set_default_organization', {
      p_org_id: data.id,
      p_team_id: teamId
    })
    if (!rpcError) {
      // Refetch to get updated is_default status
      const updated = await getOrganization(data.id, teamId)
      if (updated) {
        return updated
      }
    }
    // If RPC failed, fall through to return original data (non-default)
  }

  return rowToOrganization(data)
}

/**
 * Update an existing organization
 */
export async function updateOrganization(
  orgId: string,
  teamId: string,
  request: UpdateOrganizationRequest
): Promise<Organization> {
  // Verify organization belongs to team (team_id passed for defense in depth)
  const existing = await getOrganization(orgId, teamId)
  if (!existing) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND)
  }

  const updateData = requestToUpdateData(request)

  // Handle isDefault separately using atomic RPC - don't include in regular update
  const shouldSetDefault = request.isDefault === true
  delete updateData.is_default

  // Perform the regular field updates
  const { data, error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)
    .eq('team_id', teamId)  // Defense in depth: always filter by team_id
    .select()
    .single()

  if (error) {
    throw new Error(`${ERROR_MESSAGES.UPDATE_FAILED}: ${error.message}`)
  }

  // If setting as default, use atomic RPC function
  if (shouldSetDefault) {
    const { error: rpcError } = await supabase.rpc('set_default_organization', {
      p_org_id: orgId,
      p_team_id: teamId
    })
    if (!rpcError) {
      // Refetch to get updated is_default status
      const updated = await getOrganization(orgId, teamId)
      if (updated) {
        return updated
      }
    }
    // If RPC failed, fall through to return the updated data
  }

  return rowToOrganization(data)
}

/**
 * Delete (soft delete) an organization
 */
export async function deleteOrganization(orgId: string, teamId: string): Promise<void> {
  // Verify organization belongs to team (team_id passed for defense in depth)
  const existing = await getOrganization(orgId, teamId)
  if (!existing) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND)
  }

  // Soft delete by setting is_active = false
  const { error } = await supabase
    .from('organizations')
    .update({ is_active: false, is_default: false })
    .eq('id', orgId)
    .eq('team_id', teamId)  // Defense in depth: always filter by team_id

  if (error) {
    throw new Error(`${ERROR_MESSAGES.DELETE_FAILED}: ${error.message}`)
  }

  // If this was the default, find the next oldest active org and set it as default
  // Optimized: single query to find next default candidate instead of fetching ALL orgs
  if (existing.isDefault) {
    const { data: nextOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .neq('id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (nextOrg) {
      await supabase.rpc('set_default_organization', {
        p_org_id: nextOrg.id,
        p_team_id: teamId
      })
    }
  }
}

/**
 * Set an organization as the default for a team
 */
export async function setDefaultOrganization(orgId: string, teamId: string): Promise<Organization> {
  // Verify organization belongs to team (team_id passed for defense in depth)
  const existing = await getOrganization(orgId, teamId)
  if (!existing) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND)
  }

  // Use the database function for atomic default setting
  const { error } = await supabase.rpc('set_default_organization', {
    p_org_id: orgId,
    p_team_id: teamId
  })

  if (error) {
    throw new Error(`${ERROR_MESSAGES.SET_DEFAULT_FAILED}: ${error.message}`)
  }

  // Return updated organization
  const updated = await getOrganization(orgId, teamId)
  if (!updated) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND_AFTER_UPDATE)
  }

  return updated
}

// =============================================================================
// DOMAIN MATCHING
// =============================================================================

/**
 * Find organization for a domain using database function
 * Priority: 1. Exact match, 2. Wildcard subdomain, 3. Default org
 */
export async function findOrganizationForDomain(
  teamId: string,
  domain: string
): Promise<Organization | null> {
  // Normalize domain (remove protocol, www, trailing slash)
  const normalizedDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .toLowerCase()

  // Use the database function for efficient matching
  const { data, error } = await supabase.rpc('find_organization_for_domain', {
    p_team_id: teamId,
    p_domain: normalizedDomain
  })

  if (error) {
    // Fall back to default organization on error
    return getDefaultOrganization(teamId)
  }

  if (!data) {
    return null
  }

  return rowToOrganization(data)
}

// =============================================================================
// SANITIZATION HELPERS
// =============================================================================

/**
 * Sanitize a string to prevent prompt injection attacks
 * Removes or escapes potentially dangerous patterns
 */
function sanitizeForPrompt(value: string | undefined): string | undefined {
  if (!value) return undefined

  // Truncate to reasonable length
  const maxLength = 500
  let sanitized = value.slice(0, maxLength)

  // Remove potential prompt injection patterns
  // These patterns could be used to manipulate AI behavior
  const dangerousPatterns = [
    /```[\s\S]*?```/g,           // Code blocks
    /<script[\s\S]*?<\/script>/gi, // Script tags
    /\{\{[\s\S]*?\}\}/g,         // Template syntax
    /\[\[[\s\S]*?\]\]/g,         // Wiki-style links that could be instructions
    /\n{3,}/g,                   // Multiple newlines (replace with double)
    /ignore.*previous.*instructions?/gi,  // Common prompt injection phrase
    /system\s*:/gi,              // System prompt markers
    /assistant\s*:/gi,           // Assistant markers
    /user\s*:/gi,                // User markers
    /\bIMPORTANT\s*:/gi,         // Emphasis markers used for injection
    /\bNOTE\s*:/gi,
    /\bWARNING\s*:/gi,
  ]

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Trim whitespace
  return sanitized.trim() || undefined
}

/**
 * Sanitize an array of strings for prompt injection
 */
function sanitizeArrayForPrompt(arr: string[] | undefined): string[] | undefined {
  if (!arr || arr.length === 0) return undefined

  // Limit array size
  const maxItems = 20
  const sanitized = arr
    .slice(0, maxItems)
    .map(item => sanitizeForPrompt(item))
    .filter((item): item is string => !!item)

  return sanitized.length > 0 ? sanitized : undefined
}

// =============================================================================
// PUBLISHER SCHEMA BUILDER
// =============================================================================

/**
 * Build schema.org publisher object from organization
 * Returns null if organization has no useful data
 * NOTE: All values are sanitized to prevent prompt injection when used in AI prompts
 */
export function buildPublisherSchema(org: Organization): Record<string, any> | null {
  if (!org || !org.name) {
    return null
  }

  // Sanitize name (required field)
  const sanitizedName = sanitizeForPrompt(org.name)
  if (!sanitizedName) {
    return null
  }

  const publisher: Record<string, any> = {
    '@type': 'Organization',
    name: sanitizedName
  }

  // Add URL (sanitized)
  const sanitizedUrl = sanitizeForPrompt(org.url)
  if (sanitizedUrl) {
    publisher.url = sanitizedUrl
  }

  // Add logo (sanitized)
  const sanitizedLogoUrl = sanitizeForPrompt(org.logoUrl)
  if (sanitizedLogoUrl) {
    publisher.logo = {
      '@type': 'ImageObject',
      url: sanitizedLogoUrl
    }
  }

  // Add address if any fields are filled (all sanitized)
  const sanitizedStreetAddress = sanitizeForPrompt(org.address?.streetAddress)
  const sanitizedLocality = sanitizeForPrompt(org.address?.addressLocality)
  const sanitizedRegion = sanitizeForPrompt(org.address?.addressRegion)
  const sanitizedPostalCode = sanitizeForPrompt(org.address?.postalCode)
  const sanitizedCountry = sanitizeForPrompt(org.address?.addressCountry)

  const hasAddress = sanitizedStreetAddress || sanitizedLocality ||
    sanitizedRegion || sanitizedPostalCode || sanitizedCountry

  if (hasAddress) {
    publisher.address = {
      '@type': 'PostalAddress'
    }
    if (sanitizedStreetAddress) publisher.address.streetAddress = sanitizedStreetAddress
    if (sanitizedLocality) publisher.address.addressLocality = sanitizedLocality
    if (sanitizedRegion) publisher.address.addressRegion = sanitizedRegion
    if (sanitizedPostalCode) publisher.address.postalCode = sanitizedPostalCode
    if (sanitizedCountry) publisher.address.addressCountry = sanitizedCountry
  }

  // Add contact info (sanitized)
  const sanitizedTelephone = sanitizeForPrompt(org.telephone)
  if (sanitizedTelephone) {
    publisher.telephone = sanitizedTelephone
  }
  const sanitizedEmail = sanitizeForPrompt(org.email)
  if (sanitizedEmail) {
    publisher.email = sanitizedEmail
  }

  // Add social profiles (sanitized)
  const sanitizedSameAs = sanitizeArrayForPrompt(org.sameAs)
  if (sanitizedSameAs) {
    publisher.sameAs = sanitizedSameAs
  }

  return publisher
}

/**
 * Check if an organization has enough data to satisfy publisher requirements
 * (i.e., won't trigger validation warnings)
 */
export function hasCompletePublisherData(org: Organization): boolean {
  const hasAddress = !!(org.address?.streetAddress || org.address?.addressLocality)
  const hasContact = !!(org.telephone || org.email)
  return hasAddress && hasContact
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // CRUD operations
  listOrganizations,
  getOrganization,
  getDefaultOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setDefaultOrganization,

  // Domain matching
  findOrganizationForDomain,

  // Publisher helpers
  buildPublisherSchema,
  hasCompletePublisherData,
  calculateCompleteness
}
