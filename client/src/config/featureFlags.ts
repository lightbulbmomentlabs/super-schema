/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for the frontend.
 * These flags should match the backend feature flags to ensure consistency.
 */

export const FEATURE_FLAGS = {
  /**
   * Enable team accounts feature
   * When false, team-related API calls and UI will be disabled
   */
  TEAMS_ENABLED: import.meta.env.VITE_ENABLE_TEAMS === 'true',

  /**
   * Enable team invitations
   * When false, invitation system will be disabled
   */
  TEAM_INVITES_ENABLED: import.meta.env.VITE_ENABLE_TEAM_INVITES === 'true',
} as const

// Debug logging
console.log('🚩 [FeatureFlags] Frontend feature flags loaded:', {
  TEAMS_ENABLED: FEATURE_FLAGS.TEAMS_ENABLED,
  TEAM_INVITES_ENABLED: FEATURE_FLAGS.TEAM_INVITES_ENABLED,
  raw_VITE_ENABLE_TEAMS: import.meta.env.VITE_ENABLE_TEAMS,
  raw_VITE_ENABLE_TEAM_INVITES: import.meta.env.VITE_ENABLE_TEAM_INVITES,
  all_VITE_vars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
})

/**
 * Check if a feature is enabled
 * @param feature - The feature flag to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature]
}
