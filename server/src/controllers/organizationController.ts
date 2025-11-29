import { Response } from 'express'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import organizationService from '../services/organizationService.js'

// =============================================================================
// AUTH HELPER (Fix #22: Reduce duplicated auth checks)
// =============================================================================

/**
 * Verify the user is a team owner and throw 403 if not
 * @param isOwner - Whether the current user is the team owner
 * @param action - Description of the action being attempted (for error message)
 */
function requireTeamOwner(isOwner: boolean, action: string): void {
  if (!isOwner) {
    throw createError(`Only team owners can ${action}`, 403)
  }
}

// =============================================================================
// INPUT VALIDATION HELPERS
// =============================================================================

const MAX_NAME_LENGTH = 200
const MAX_URL_LENGTH = 2048
const MAX_ARRAY_LENGTH = 50
const MAX_STRING_FIELD_LENGTH = 500

/**
 * Validate URL format (basic validation, not exhaustive)
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate email format (basic validation)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (basic validation)
 */
function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/
  return phoneRegex.test(phone)
}

/**
 * Validate array of strings with length and item limits
 */
function validateStringArray(
  arr: unknown,
  fieldName: string,
  maxItems: number = MAX_ARRAY_LENGTH,
  maxItemLength: number = MAX_URL_LENGTH
): string[] {
  if (arr === undefined || arr === null) {
    return []
  }

  if (!Array.isArray(arr)) {
    throw createError(`${fieldName} must be an array`, 400)
  }

  if (arr.length > maxItems) {
    throw createError(`${fieldName} cannot exceed ${maxItems} items`, 400)
  }

  return arr.map((item, index) => {
    if (typeof item !== 'string') {
      throw createError(`${fieldName}[${index}] must be a string`, 400)
    }
    const trimmed = item.trim()
    if (trimmed.length > maxItemLength) {
      throw createError(`${fieldName}[${index}] exceeds maximum length of ${maxItemLength}`, 400)
    }
    return trimmed
  }).filter(item => item.length > 0)
}

/**
 * Validate organization input for create/update
 */
function validateOrganizationInput(body: Record<string, unknown>, isCreate: boolean = false): void {
  const { name, url, logoUrl, email, telephone, sameAs, associatedDomains } = body

  // Name validation
  if (isCreate) {
    if (!name || typeof name !== 'string' || (name as string).trim().length === 0) {
      throw createError('Organization name is required', 400)
    }
  }
  if (name !== undefined) {
    if (typeof name !== 'string') {
      throw createError('Organization name must be a string', 400)
    }
    if ((name as string).trim().length > MAX_NAME_LENGTH) {
      throw createError(`Organization name cannot exceed ${MAX_NAME_LENGTH} characters`, 400)
    }
  }

  // URL validation
  if (url !== undefined && url !== null && url !== '') {
    if (typeof url !== 'string') {
      throw createError('URL must be a string', 400)
    }
    const trimmedUrl = (url as string).trim()
    if (trimmedUrl.length > MAX_URL_LENGTH) {
      throw createError(`URL cannot exceed ${MAX_URL_LENGTH} characters`, 400)
    }
    if (trimmedUrl && !isValidUrl(trimmedUrl)) {
      throw createError('Invalid URL format. Must start with http:// or https://', 400)
    }
  }

  // Logo URL validation
  if (logoUrl !== undefined && logoUrl !== null && logoUrl !== '') {
    if (typeof logoUrl !== 'string') {
      throw createError('Logo URL must be a string', 400)
    }
    const trimmedLogoUrl = (logoUrl as string).trim()
    if (trimmedLogoUrl.length > MAX_URL_LENGTH) {
      throw createError(`Logo URL cannot exceed ${MAX_URL_LENGTH} characters`, 400)
    }
    if (trimmedLogoUrl && !isValidUrl(trimmedLogoUrl)) {
      throw createError('Invalid logo URL format. Must start with http:// or https://', 400)
    }
  }

  // Email validation
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string') {
      throw createError('Email must be a string', 400)
    }
    const trimmedEmail = (email as string).trim()
    if (trimmedEmail.length > MAX_STRING_FIELD_LENGTH) {
      throw createError(`Email cannot exceed ${MAX_STRING_FIELD_LENGTH} characters`, 400)
    }
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      throw createError('Invalid email format', 400)
    }
  }

  // Telephone validation
  if (telephone !== undefined && telephone !== null && telephone !== '') {
    if (typeof telephone !== 'string') {
      throw createError('Telephone must be a string', 400)
    }
    const trimmedPhone = (telephone as string).trim()
    if (trimmedPhone.length > MAX_STRING_FIELD_LENGTH) {
      throw createError(`Telephone cannot exceed ${MAX_STRING_FIELD_LENGTH} characters`, 400)
    }
    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      throw createError('Invalid telephone format', 400)
    }
  }

  // Validate sameAs array (social profile URLs)
  if (sameAs !== undefined) {
    const validatedSameAs = validateStringArray(sameAs, 'sameAs')
    for (const socialUrl of validatedSameAs) {
      if (socialUrl && !isValidUrl(socialUrl)) {
        throw createError(`Invalid URL in sameAs: ${socialUrl}`, 400)
      }
    }
  }

  // Validate associatedDomains array
  if (associatedDomains !== undefined) {
    validateStringArray(associatedDomains, 'associatedDomains', MAX_ARRAY_LENGTH, MAX_STRING_FIELD_LENGTH)
  }
}

// =============================================================================
// ORGANIZATION CRUD HANDLERS
// =============================================================================

/**
 * GET /api/organizations
 * List all organizations for the current team
 */
export const listOrganizations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.auth!.teamId!

    // Parse pagination params from query (Fix #13)
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined

    const result = await organizationService.listOrganizations(teamId, { limit, offset })

    // Calculate completeness for each
    const organizationsWithCompleteness = result.data.map(org => ({
      ...org,
      completeness: organizationService.calculateCompleteness(org)
    }))

    res.json({
      success: true,
      data: organizationsWithCompleteness,
      pagination: result.pagination
    })
  }
)

/**
 * GET /api/organizations/:id
 * Get a single organization by ID
 */
export const getOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const teamId = req.auth!.teamId!

    if (!id) {
      throw createError('Organization ID is required', 400)
    }

    const organization = await organizationService.getOrganization(id, teamId)

    if (!organization) {
      throw createError('Organization not found', 404)
    }

    const completeness = organizationService.calculateCompleteness(organization)

    res.json({
      success: true,
      data: {
        organization,
        completeness
      }
    })
  }
)

/**
 * POST /api/organizations
 * Create a new organization
 */
export const createOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.auth!.teamId!
    const isOwner = req.auth!.isTeamOwner

    // Only team owners can create organizations (Fix #22: using helper)
    requireTeamOwner(isOwner, 'create organizations')

    // Validate all input fields
    validateOrganizationInput(req.body, true)

    const { name, url, logoUrl, address, telephone, email, sameAs, associatedDomains, isDefault } = req.body

    const organization = await organizationService.createOrganization(teamId, {
      name: name.trim(),
      url: url?.trim() || undefined,
      logoUrl: logoUrl?.trim() || undefined,
      address,
      telephone: telephone?.trim() || undefined,
      email: email?.trim() || undefined,
      sameAs: sameAs || [],
      associatedDomains: associatedDomains || [],
      isDefault
    })

    const completeness = organizationService.calculateCompleteness(organization)

    res.status(201).json({
      success: true,
      data: {
        organization,
        completeness
      },
      message: 'Organization created successfully'
    })
  }
)

/**
 * PUT /api/organizations/:id
 * Update an existing organization
 */
export const updateOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const teamId = req.auth!.teamId!
    const isOwner = req.auth!.isTeamOwner

    if (!id) {
      throw createError('Organization ID is required', 400)
    }

    // Only team owners can update organizations (Fix #22: using helper)
    requireTeamOwner(isOwner, 'update organizations')

    // Validate all input fields
    validateOrganizationInput(req.body, false)

    const { name, url, logoUrl, address, telephone, email, sameAs, associatedDomains, isDefault } = req.body

    const organization = await organizationService.updateOrganization(id, teamId, {
      name: name?.trim(),
      url: url !== undefined ? (url?.trim() || undefined) : undefined,
      logoUrl: logoUrl !== undefined ? (logoUrl?.trim() || undefined) : undefined,
      address,
      telephone: telephone !== undefined ? (telephone?.trim() || undefined) : undefined,
      email: email !== undefined ? (email?.trim() || undefined) : undefined,
      sameAs,
      associatedDomains,
      isDefault
    })

    const completeness = organizationService.calculateCompleteness(organization)

    res.json({
      success: true,
      data: {
        organization,
        completeness
      },
      message: 'Organization updated successfully'
    })
  }
)

/**
 * DELETE /api/organizations/:id
 * Delete an organization (soft delete)
 */
export const deleteOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const teamId = req.auth!.teamId!
    const isOwner = req.auth!.isTeamOwner

    if (!id) {
      throw createError('Organization ID is required', 400)
    }

    // Only team owners can delete organizations (Fix #22: using helper)
    requireTeamOwner(isOwner, 'delete organizations')

    await organizationService.deleteOrganization(id, teamId)

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    })
  }
)

/**
 * POST /api/organizations/:id/default
 * Set an organization as the default for the team
 */
export const setDefaultOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const teamId = req.auth!.teamId!
    const isOwner = req.auth!.isTeamOwner

    if (!id) {
      throw createError('Organization ID is required', 400)
    }

    // Only team owners can set default (Fix #22: using helper)
    requireTeamOwner(isOwner, 'set the default organization')

    const organization = await organizationService.setDefaultOrganization(id, teamId)

    res.json({
      success: true,
      data: organization,
      message: 'Default organization updated successfully'
    })
  }
)

/**
 * GET /api/organizations/for-domain
 * Find organization for a specific domain
 * Query param: domain
 */
export const getOrganizationForDomain = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.auth!.teamId!
    const { domain } = req.query

    if (!domain || typeof domain !== 'string') {
      throw createError('Domain query parameter is required', 400)
    }

    const organization = await organizationService.findOrganizationForDomain(teamId, domain)

    if (!organization) {
      return res.json({
        success: true,
        data: null,
        message: 'No organization found for this domain'
      })
    }

    const completeness = organizationService.calculateCompleteness(organization)
    const publisherData = organizationService.buildPublisherSchema(organization)

    res.json({
      success: true,
      data: {
        organization,
        completeness,
        publisherData
      }
    })
  }
)

export default {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setDefaultOrganization,
  getOrganizationForDomain
}
