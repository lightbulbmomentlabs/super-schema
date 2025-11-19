/**
 * Feature Flags for Team Shared Account Feature
 *
 * These flags allow safe, gradual rollout of the team features with instant rollback capability.
 * Set in environment variables to control feature availability without code changes.
 */

export const FEATURE_FLAGS = {
  /**
   * Master toggle for all team features
   * When false: Team sections hidden, team API endpoints return 404, app operates in single-user mode
   * When true: Team features visible and functional
   */
  TEAMS_ENABLED: process.env.ENABLE_TEAMS === 'true',

  /**
   * Toggle for team invitation functionality
   * When false: Users can view team info but cannot create invites or join teams
   * When true: Full invite/join functionality enabled
   *
   * Use case: Enable team viewing first, then enable invites after validation
   */
  TEAMS_INVITES_ENABLED: process.env.ENABLE_TEAM_INVITES === 'true',

  /**
   * Indicates data migration to teams model is complete
   * When false: App uses backward compatibility layer (queries by user_id with team_id fallback)
   * When true: App uses team_id exclusively, assumes all data migrated
   *
   * Use case: Flip after validating all users have teams and all data has team_id
   */
  TEAMS_MIGRATION_COMPLETE: process.env.TEAMS_MIGRATION_COMPLETE === 'true',

  /**
   * Beta user allowlist (comma-separated user IDs)
   * When set: Only specified users can access team features (even if TEAMS_ENABLED=true)
   * When empty/unset: All users can access team features (if TEAMS_ENABLED=true)
   *
   * Use case: Test with specific users before full rollout
   */
  TEAMS_BETA_USERS: process.env.TEAMS_BETA_USERS?.split(',').map(id => id.trim()) || [],

  /**
   * Master toggle for GA4 AI Crawler Analytics feature
   * When false: AI Analytics sections hidden, GA4 API endpoints return 404
   * When true: AI Analytics dashboard and GA4 integration enabled
   *
   * Use case: Gradual rollout of GA4 integration for tracking AI crawler traffic
   */
  GA4_AI_ANALYTICS_ENABLED: process.env.GA4_AI_ANALYTICS_ENABLED === 'true',
}

/**
 * Check if teams feature is enabled for a specific user
 */
export function isTeamsEnabledForUser(userId: string): boolean {
  if (!FEATURE_FLAGS.TEAMS_ENABLED) {
    return false
  }

  // If beta list is empty, enabled for all users
  if (FEATURE_FLAGS.TEAMS_BETA_USERS.length === 0) {
    return true
  }

  // Check if user is in beta list
  return FEATURE_FLAGS.TEAMS_BETA_USERS.includes(userId)
}

/**
 * Check if team invites are enabled for a specific user
 */
export function isTeamInvitesEnabledForUser(userId: string): boolean {
  return isTeamsEnabledForUser(userId) && FEATURE_FLAGS.TEAMS_INVITES_ENABLED
}

/**
 * Log current feature flag status (for debugging)
 */
export function logFeatureFlags(): void {
  console.log('🚩 Feature Flags:')
  console.log('  TEAMS_ENABLED:', FEATURE_FLAGS.TEAMS_ENABLED)
  console.log('  TEAMS_INVITES_ENABLED:', FEATURE_FLAGS.TEAMS_INVITES_ENABLED)
  console.log('  TEAMS_MIGRATION_COMPLETE:', FEATURE_FLAGS.TEAMS_MIGRATION_COMPLETE)
  console.log('  TEAMS_BETA_USERS:', FEATURE_FLAGS.TEAMS_BETA_USERS.length > 0
    ? `${FEATURE_FLAGS.TEAMS_BETA_USERS.length} users`
    : 'All users')
  console.log('  GA4_AI_ANALYTICS_ENABLED:', FEATURE_FLAGS.GA4_AI_ANALYTICS_ENABLED)
}
