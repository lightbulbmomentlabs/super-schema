import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  requireTeamsEnabled,
  requireTeamOwner,
  requireTeamMember,
  requireTeamContext
} from '../middleware/teamAuth.js'
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setDefaultOrganization,
  getOrganizationForDomain
} from '../controllers/organizationController.js'

const router = Router()

// =============================================================================
// ORGANIZATION CRUD ROUTES
// =============================================================================

/**
 * GET /api/organizations
 * List all organizations for the current team
 * Requires: Team member
 */
router.get(
  '/',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  listOrganizations
)

/**
 * GET /api/organizations/for-domain
 * Find organization for a specific domain
 * Query param: ?domain=example.com
 * Requires: Team member
 * NOTE: This route must be defined before /:id to avoid conflict
 */
router.get(
  '/for-domain',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  getOrganizationForDomain
)

/**
 * GET /api/organizations/:id
 * Get a single organization by ID
 * Requires: Team member
 */
router.get(
  '/:id',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamMember,
  getOrganization
)

/**
 * POST /api/organizations
 * Create a new organization
 * Requires: Team owner
 */
router.post(
  '/',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  createOrganization
)

/**
 * PUT /api/organizations/:id
 * Update an existing organization
 * Requires: Team owner
 */
router.put(
  '/:id',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  updateOrganization
)

/**
 * DELETE /api/organizations/:id
 * Delete an organization (soft delete)
 * Requires: Team owner
 */
router.delete(
  '/:id',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  deleteOrganization
)

/**
 * POST /api/organizations/:id/default
 * Set an organization as the default for the team
 * Requires: Team owner
 */
router.post(
  '/:id/default',
  authMiddleware,
  requireTeamsEnabled,
  requireTeamContext,
  requireTeamOwner,
  setDefaultOrganization
)

export default router
